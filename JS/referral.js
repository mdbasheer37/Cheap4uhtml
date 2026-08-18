/**
 * referral.js — Referral program page. Uses /api/referral/{info,stats,
 * history,referred-users,use-bonus}. use-bonus takes user_email (its
 * route has no @jwt_required — it authenticates via email in the body),
 * so we pass the cached user's email exactly as that endpoint expects.
 */

async function loadReferral() {
  const [infoRes, statsRes, usersRes, historyRes] = await Promise.allSettled([
    Api.referral.info(),
    Api.referral.stats(),
    Api.referral.referredUsers(),
    Api.referral.history(),
  ]);

  if (infoRes.status === 'fulfilled') {
    const d = infoRes.value.data;
    document.getElementById('referralBalance').textContent = Utils.money(d.referral_balance);
    document.getElementById('refCode').textContent = d.referral_code || '—';
    document.getElementById('refLink').textContent = d.referral_link || '—';
    document.getElementById('thresholdMsg').textContent = d.can_use_bonus
      ? 'You can move your referral balance to your wallet.'
      : `Earn ₦${d.next_bonus_threshold?.toFixed?.(2) ?? d.next_bonus_threshold} more to unlock transfer to wallet (min ₦200).`;
    document.getElementById('useBonusBtn').disabled = !d.can_use_bonus;
  }

  if (statsRes.status === 'fulfilled') {
    const d = statsRes.value.data;
    document.getElementById('totalRef').textContent = d.total_referrals;
    document.getElementById('pendingRef').textContent = d.pending_referrals;
    document.getElementById('completedRef').textContent = d.completed_referrals;
    document.getElementById('totalEarnings').textContent = Utils.money(d.total_earnings);
  }

  const usersBox = document.getElementById('referredUsersList');
  if (usersRes.status === 'fulfilled') {
    const users = usersRes.value.data || [];
    usersBox.innerHTML = users.length
      ? users.map(u => `
        <div class="txn-row">
          <div class="txn-row__icon"><span class="material-symbols-outlined">person</span></div>
          <div class="txn-row__body">
            <div class="txn-row__title" style="text-transform:none;">${Utils.esc(u.name)}</div>
            <div class="txn-row__meta">Joined ${Utils.esc(u.joined_date)} · ${u.wallet_funded ? 'Funded wallet' : 'Not funded yet'}</div>
          </div>
          <div>${Utils.statusBadge(u.status)}</div>
        </div>`).join('')
      : `<div class="empty-state small">You haven't referred anyone yet. Share your link to start earning!</div>`;
  } else {
    usersBox.innerHTML = `<div class="empty-state small">Could not load referred users.</div>`;
  }

  const historyBox = document.getElementById('referralHistoryList');
  if (historyRes.status === 'fulfilled') {
    const rows = historyRes.value.data || [];
    historyBox.innerHTML = rows.length
      ? rows.map(t => `
        <div class="txn-row">
          <div class="txn-row__icon"><span class="material-symbols-outlined">handshake</span></div>
          <div class="txn-row__body">
            <div class="txn-row__title" style="text-transform:none;">${Utils.esc(t.type.replace(/_/g,' '))} — ${Utils.esc(t.referred_user_name)}</div>
            <div class="txn-row__meta">${Utils.esc(t.created_at)}</div>
          </div>
          <div class="txn-row__amount" style="color:var(--green-600);">+${Utils.money(t.amount)}</div>
        </div>`).join('')
      : `<div class="empty-state small">No referral bonus history yet.</div>`;
  } else {
    historyBox.innerHTML = `<div class="empty-state small">Could not load referral history.</div>`;
  }
}

document.addEventListener('click', async (e) => {
  if (e.target.id === 'copyCodeBtn') Utils.copyToClipboard(document.getElementById('refCode').textContent, 'Referral code copied');
  if (e.target.id === 'copyLinkBtn') Utils.copyToClipboard(document.getElementById('refLink').textContent, 'Referral link copied');
});

document.getElementById('useBonusBtn')?.addEventListener('click', async () => {
  const user = Api.getUser();
  if (!user?.email) return;
  const btn = document.getElementById('useBonusBtn');
  const balanceText = document.getElementById('referralBalance').textContent.replace(/[₦,]/g, '');
  const amount = Number(balanceText);
  if (!(amount >= CONFIG.MIN_REFERRAL_BONUS_USE)) {
    Utils.toast(`Minimum transfer is ${Utils.money(CONFIG.MIN_REFERRAL_BONUS_USE)}`, 'warning');
    return;
  }
  Utils.setButtonLoading(btn, true, 'Processing…');
  try {
    const res = await Api.referral.useBonus({ user_email: user.email, amount });
    Utils.toast(res.message || 'Transferred to wallet', 'success');
    loadReferral();
  } catch (err) {
    Utils.toast(err.message, 'error');
  } finally {
    Utils.setButtonLoading(btn, false);
  }
});

Auth.guard(loadReferral);
