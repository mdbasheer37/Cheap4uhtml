/**
 * cashback.js — Cashback wallet/rates/history via /api/cashback/*.
 */

let cbCanRedeem = false;

async function loadCashback() {
  try {
    const res = await Api.cashback.wallet();
    const d = res.data;
    document.getElementById('cbBalance').textContent = Utils.money(d.balance);
    document.getElementById('cbEarned').textContent = Utils.money(d.total_earned);
    document.getElementById('cbRedeemed').textContent = Utils.money(d.total_redeemed);
    cbCanRedeem = !!d.can_redeem;
    document.getElementById('redeemBtn').disabled = !cbCanRedeem;
    document.getElementById('cbExpiryMsg').textContent = d.expiring_soon > 0
      ? `₦${d.expiring_soon.toFixed(2)} expiring soon${d.next_expiry_date ? ' on ' + Utils.dateFmt(d.next_expiry_date) : ''}.`
      : `Minimum redeem amount: ${Utils.money(d.min_redeem_amount)}`;
  } catch (err) {
    Utils.toast('Could not load cashback wallet: ' + err.message, 'error');
  }

  try {
    const res = await Api.cashback.rates();
    const d = res.data;
    const box = document.getElementById('ratesCard');
    if (!d.cashback_enabled) {
      box.innerHTML = `<div class="empty-state small">Cashback is currently disabled.</div>`;
    } else {
      const rows = Object.entries(d.rates).map(([k, v]) => `
        <div class="summary-row"><span>${Utils.esc(k.replace(/_/g, ' '))}</span><span>${v}%</span></div>`).join('');
      box.innerHTML = `<div class="summary-list">${rows}</div>`;
    }
  } catch {
    document.getElementById('ratesCard').innerHTML = `<div class="empty-state small">Could not load rates.</div>`;
  }

  try {
    const res = await Api.cashback.history({ per_page: 30 });
    const rows = res.data.entries || [];
    const box = document.getElementById('historyList');
    box.innerHTML = rows.length ? rows.map(e => `
      <div class="txn-row">
        <div class="txn-row__icon"><span class="material-symbols-outlined">savings</span></div>
        <div class="txn-row__body">
          <div class="txn-row__title">${Utils.esc((e.category || e.type || '').replace(/_/g,' '))}</div>
          <div class="txn-row__meta">${Utils.dateFmt(e.created_at)}${e.note ? ' · ' + Utils.esc(e.note) : ''}</div>
        </div>
        <div class="txn-row__amount" style="color:${e.type === 'earned' || e.type === 'admin_credit' ? 'var(--green)' : 'var(--gray-900)'}">
          ${e.type === 'earned' || e.type === 'admin_credit' ? '+' : '-'}${Utils.money(e.amount)}
        </div>
      </div>`).join('') : `<div class="empty-state small">No cashback activity yet.</div>`;
  } catch {
    document.getElementById('historyList').innerHTML = `<div class="empty-state small">Could not load history.</div>`;
  }
}

document.getElementById('redeemBtn')?.addEventListener('click', async () => {
  if (!cbCanRedeem) return;
  const btn = document.getElementById('redeemBtn');
  Utils.setButtonLoading(btn, true, 'Redeeming…');
  try {
    const res = await Api.cashback.redeem({});
    Utils.toast(res.message || 'Cashback redeemed to wallet', 'success');
    loadCashback();
  } catch (err) {
    Utils.toast(err.message, 'error');
  } finally {
    Utils.setButtonLoading(btn, false);
  }
});

Auth.guard(loadCashback);
