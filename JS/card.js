/**
 * card.js — Virtual Dollar Card via /api/cards/* (card_routes.py).
 * All balances, card numbers (masked), and status come straight from the
 * backend/provider — nothing simulated here.
 */

let cardConfig = null;

function cardTile(card) {
  const frozen = card.status === 'frozen';
  return `
    <div class="dollar-card ${frozen ? 'frozen' : ''}" data-card-id="${card.id}">
      <div class="dollar-card__brand">
        <span>${Utils.esc(card.card_brand || 'Visa')}</span>
        <span>${frozen ? '🧊 FROZEN' : card.status === 'terminated' ? 'TERMINATED' : ''}</span>
      </div>
      <div class="dollar-card__number">${Utils.esc(card.card_number_masked || '•••• •••• •••• ••••')}</div>
      <div class="dollar-card__footer">
        <div>
          <div>${Utils.esc(card.cardholder_name || '')}</div>
          <div>${Utils.esc(card.expiry_month || '••')}/${Utils.esc(card.expiry_year || '••')}</div>
        </div>
        <div style="text-align:right;">
          <div>Balance</div>
          <div class="dollar-card__balance">$${(card.balance ?? 0).toFixed(2)}</div>
        </div>
      </div>
    </div>
    <div class="flex gap-8 mb-16">
      <button class="btn btn-outline btn-sm btn-block" data-action="fund" data-id="${card.id}">Fund</button>
      ${card.status === 'frozen'
        ? `<button class="btn btn-outline btn-sm btn-block" data-action="unfreeze" data-id="${card.id}">Unfreeze</button>`
        : `<button class="btn btn-outline btn-sm btn-block" data-action="freeze" data-id="${card.id}">Freeze</button>`}
      <button class="btn btn-outline btn-sm btn-block" data-action="history" data-id="${card.id}">History</button>
      <button class="btn btn-danger btn-sm btn-block" data-action="delete" data-id="${card.id}">Delete</button>
    </div>`;
}

async function loadCards() {
  const box = document.getElementById('cardsContent');
  try {
    const [configRes, listRes] = await Promise.all([Api.cards.config(), Api.cards.list()]);
    cardConfig = configRes.data;

    if (!cardConfig.is_enabled) {
      box.innerHTML = `<div class="empty-state"><div class="empty-state__icon">💳</div><div class="empty-state__title">Dollar Card is currently unavailable</div><p>Please check back later.</p></div>`;
      return;
    }

    const cards = listRes.data || [];
    let html = '';
    if (!cards.length) {
      html += `<div class="empty-state"><div class="empty-state__icon">💳</div><div class="empty-state__title">No dollar cards yet</div><p>Create one to start spending in USD online.</p></div>`;
    } else {
      html += cards.map(cardTile).join('');
    }
    html += `<button class="btn btn-primary btn-block mt-16" id="newCardBtn">+ Create New Card</button>
      <div class="card mt-16">
        <div class="card-title">Card Details</div>
        <div class="summary-list">
          <div class="summary-row"><span>Provider</span><span>${Utils.esc(cardConfig.provider_name)}</span></div>
          <div class="summary-row"><span>Exchange rate</span><span>₦${cardConfig.usd_to_ngn_rate}/$1</span></div>
          <div class="summary-row"><span>Creation fee</span><span>$${cardConfig.card_creation_fee_usd}</span></div>
          <div class="summary-row"><span>Minimum funding</span><span>$${cardConfig.min_funding_usd}</span></div>
          <div class="summary-row"><span>Max card balance</span><span>$${cardConfig.max_card_balance_usd}</span></div>
        </div>
      </div>`;
    box.innerHTML = html;

    document.getElementById('newCardBtn').addEventListener('click', () => {
      document.getElementById('createCardHint').textContent =
        `Minimum funding is $${cardConfig.min_funding_usd}. A $${cardConfig.card_creation_fee_usd} creation fee applies, charged in NGN from your wallet at ₦${cardConfig.usd_to_ngn_rate}/$1.`;
      Utils.openModal('createCardModal');
    });

    box.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => handleCardAction(btn.dataset.action, Number(btn.dataset.id)));
    });
  } catch (err) {
    box.innerHTML = `<div class="empty-state">Could not load your cards: ${Utils.esc(err.message)}</div>`;
  }
}

async function handleCardAction(action, cardId) {
  if (action === 'freeze' || action === 'unfreeze') {
    try {
      const res = action === 'freeze' ? await Api.cards.freeze(cardId) : await Api.cards.unfreeze(cardId);
      Utils.toast(res.message, 'success');
      loadCards();
    } catch (err) { Utils.toast(err.message, 'error'); }
  } else if (action === 'delete') {
    if (!confirm('Delete this card? Its balance will be refunded to your wallet.')) return;
    try {
      const res = await Api.cards.remove(cardId);
      Utils.toast(res.message, 'success');
      loadCards();
    } catch (err) { Utils.toast(err.message, 'error'); }
  } else if (action === 'fund') {
    const amount = prompt('Amount to fund (USD):');
    if (!amount || isNaN(Number(amount))) return;
    try {
      const res = await Api.cards.fund(cardId, { amount_usd: Number(amount) });
      Utils.toast(res.message, 'success');
      loadCards();
    } catch (err) { Utils.toast(err.message, 'error'); }
  } else if (action === 'history') {
    window.location.href = `card-history.html?card_id=${cardId}`;
  }
}

document.getElementById('createCardBtn')?.addEventListener('click', async () => {
  const amount = Number(document.getElementById('fundAmount').value);
  if (!(amount > 0)) { Utils.toast('Enter a valid funding amount', 'error'); return; }
  const btn = document.getElementById('createCardBtn');
  Utils.setButtonLoading(btn, true, 'Creating…');
  try {
    const res = await Api.cards.create({ funding_amount_usd: amount });
    Utils.toast(res.message || 'Card created', 'success');
    Utils.closeModal('createCardModal');
    loadCards();
  } catch (err) {
    Utils.toast(err.message, 'error');
  } finally {
    Utils.setButtonLoading(btn, false);
  }
});

Auth.guard(loadCards);
