/**
 * challenge.js — Monthly Challenge via /api/challenge/*.
 */

function fmtCountdown(seconds) {
  if (!seconds || seconds <= 0) return 'Ended';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return `${d}d ${h}h`;
}

async function loadChallenge() {
  try {
    const res = await Api.challenge.mySummary();
    const d = res.data;
    document.getElementById('myRank').textContent = d.rank ? `#${d.rank}` : 'Unranked';
    document.getElementById('myStanding').textContent = d.reward_position
      ? `You're in ${d.reward_position}! Keep it up.`
      : d.challenge_enabled ? 'Make a purchase to join the leaderboard.' : 'The monthly challenge is currently disabled.';
    document.getElementById('myTotal').textContent = Utils.money(d.total_monthly_purchases);
    document.getElementById('totalParticipants').textContent = d.total_participants;
    document.getElementById('overtake').textContent = d.amount_to_overtake_next != null ? Utils.money(d.amount_to_overtake_next) : '—';
    document.getElementById('countdown').textContent = fmtCountdown(d.countdown_seconds);
  } catch (err) {
    Utils.toast('Could not load your challenge summary: ' + err.message, 'error');
  }

  try {
    const res = await Api.challenge.leaderboard({ limit: 50 });
    const rows = res.data.leaderboard || [];
    const box = document.getElementById('leaderboardList');
    box.innerHTML = rows.length ? rows.map(u => `
      <div class="txn-row">
        <div class="txn-row__icon">${u.rank <= 3 ? ['🥇','🥈','🥉'][u.rank - 1] : `#${u.rank}`}</div>
        <div class="txn-row__body">
          <div class="txn-row__title" style="text-transform:none;">${Utils.esc(u.name)}</div>
          <div class="txn-row__meta">${u.purchase_count} purchase(s)${u.reward_position ? ' · ' + Utils.esc(u.reward_position) : ''}</div>
        </div>
        <div class="txn-row__amount">${Utils.money(u.total_amount)}</div>
      </div>`).join('') : `<div class="empty-state small">No participants yet this month. Be the first!</div>`;
  } catch {
    document.getElementById('leaderboardList').innerHTML = `<div class="empty-state small">Could not load leaderboard.</div>`;
  }

  try {
    const res = await Api.challenge.winners({ per_page: 20 });
    const rows = res.data.winners || [];
    const box = document.getElementById('winnersList');
    box.innerHTML = rows.length ? rows.map(w => `
      <div class="txn-row">
        <div class="txn-row__icon"><span class="material-symbols-outlined">emoji_events</span></div>
        <div class="txn-row__body">
          <div class="txn-row__title" style="text-transform:none;">${Utils.esc(w.user_name || w.name || 'Winner')} — ${Utils.esc(w.month || '')}</div>
          <div class="txn-row__meta">${Utils.esc(w.rank_label || w.reward_position || '')}</div>
        </div>
        <div class="txn-row__amount" style="color:var(--green-600);">${Utils.money(w.reward_amount)}</div>
      </div>`).join('') : `<div class="empty-state small">No winners announced yet.</div>`;
  } catch {
    document.getElementById('winnersList').innerHTML = `<div class="empty-state small">Could not load past winners.</div>`;
  }

  try {
    const res = await Api.challenge.notifications({});
    const count = res.data.unread_count || 0;
    document.getElementById('unreadCount').textContent = count > 0 ? `(${count})` : '';
    window._notifRows = res.data.notifications || [];
  } catch { /* non-fatal */ }
}

document.getElementById('notifBell')?.addEventListener('click', async () => {
  const list = document.getElementById('notifList');
  const rows = window._notifRows || [];
  list.innerHTML = rows.length ? rows.map(n => `
    <div class="txn-row">
      <div class="txn-row__icon">${n.is_read ? '<span class="material-symbols-outlined">mail</span>' : '<span class="material-symbols-outlined">mark_email_unread</span>'}</div>
      <div class="txn-row__body">
        <div class="txn-row__title" style="text-transform:none;">${Utils.esc(n.title || n.message || 'Notification')}</div>
        <div class="txn-row__meta">${Utils.dateFmt(n.created_at)}</div>
      </div>
    </div>`).join('') : `<div class="empty-state small">No notifications yet.</div>`;
  Utils.openModal('notifModal');
  try {
    await Api.challenge.markNotificationsRead({});
    document.getElementById('unreadCount').textContent = '';
  } catch { /* non-fatal */ }
});

Auth.guard(loadChallenge);
