/**
 * dashboard.js — Home screen. Wallet balance, referral balance, and the
 * Monthly Champion Challenge card all come from live API responses.
 */

function fmtCountdown(seconds) {
  if (!seconds || seconds <= 0) return 'Ended';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${String(m).padStart(2, '0')}m`;
}

async function loadDashboard() {
  const user = Api.getUser();
  document.getElementById('greetingName').textContent = `Hi ${user?.name ? user.name.split(' ')[0] : 'there'}`;

  renderTileGrid(document.getElementById('quickActionsGrid'), QUICK_ACTIONS);
  renderTileGrid(document.getElementById('servicesGrid'), SERVICES, 'grid-tile grid-tile--service');

  // Wallet balance + account number
  try {
    const acc = await Api.payment.accountDetails();
    const d = acc.data;
    document.getElementById('walletBalance').textContent = Utils.money(d.wallet_balance);

    const accCard = document.getElementById('accountNumberCard');
    if (d.has_virtual_account) {
      accCard.innerHTML = `
        <div class="account-number-card__label">Your account number</div>
        <div class="account-number-row">
          <span class="ic">🏦</span>
          <span>${Utils.esc(d.bank_name)} — ${Utils.esc(d.account_number)}</span>
          <button data-copy="${Utils.esc(d.account_number)}">📋</button>
        </div>`;
      accCard.querySelector('[data-copy]').addEventListener('click', (e) => {
        Utils.copyToClipboard(e.currentTarget.dataset.copy, 'Account number copied');
      });
    } else {
      accCard.innerHTML = `
        <div class="account-number-card__label">Fund your wallet</div>
        <p class="small text-muted">${Utils.esc(d.funding_message || 'Fund via card payment.')}</p>
        <a href="wallet.html" class="btn btn-primary btn-sm mt-8">Fund Wallet</a>`;
    }
  } catch (err) {
    document.getElementById('walletBalance').textContent = '₦0.00';
  }

  // Referral balance
  try {
    const ref = await Api.referral.info();
    document.getElementById('referralBalance').textContent = Utils.money(ref.data.referral_balance);
  } catch { /* leave placeholder */ }

  // Monthly Champion Challenge
  try {
    const res = await Api.challenge.mySummary();
    const d = res.data;
    document.getElementById('challengeRank').textContent = d.rank ? `#${d.rank}` : 'Unranked';
    document.getElementById('challengeTotal').textContent = Utils.money(d.total_monthly_purchases);
    document.getElementById('challengeTimer').textContent = fmtCountdown(d.countdown_seconds);
    document.getElementById('challengeNote').textContent = d.rank === 1
      ? "You're in the lead — keep it up!"
      : d.amount_to_overtake_next != null
        ? `Spend ${Utils.money(d.amount_to_overtake_next)} more to move up!`
        : (d.challenge_enabled ? 'Make a purchase to join the leaderboard.' : 'The monthly challenge is currently disabled.');
  } catch {
    document.getElementById('challengeNote').textContent = 'Could not load challenge status.';
  }

  // Notifications badge
  try {
    const res = await Api.challenge.notifications({});
    const count = res.data.unread_count || 0;
    window._notifRows = res.data.notifications || [];
    document.getElementById('notifDot').classList.toggle('hidden', count === 0);
  } catch { /* non-fatal */ }
}

document.getElementById('notifBell').addEventListener('click', async () => {
  const list = document.getElementById('notifList');
  const rows = window._notifRows || [];
  list.innerHTML = rows.length ? rows.map(n => `
    <div class="txn-row">
      <div class="txn-row__icon">${n.is_read ? '📭' : '📬'}</div>
      <div class="txn-row__body">
        <div class="txn-row__title" style="text-transform:none;">${Utils.esc(n.title || n.message || 'Notification')}</div>
        <div class="txn-row__meta">${Utils.dateFmt(n.created_at)}</div>
      </div>
    </div>`).join('') : `<div class="empty-state small">No notifications yet.</div>`;
  Utils.openModal('notifModal');
  try {
    await Api.challenge.markNotificationsRead({});
    document.getElementById('notifDot').classList.add('hidden');
  } catch { /* non-fatal */ }
});

Auth.guard(loadDashboard);
