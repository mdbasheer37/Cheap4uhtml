/**
 * profit.js — Admin Profit Dashboard via /api/admin/profit and
 * /api/admin/withdrawals. Gated the same way the real app gates it
 * (hardcoded admin email list / role check) — also enforced server-side.
 */

const CATEGORY_LABELS = {
  airtime: 'Airtime profit', data: 'Data profit', electricity: 'Electricity profit',
  cable_tv: 'Cable TV profit', exam_pin: 'Exam PIN profit', spin_fee: 'Spin & Win fees',
  card_fee: 'Dollar Card fees',
};

function checkAdmin() {
  const user = Api.getUser();
  const ADMIN_EMAILS = ['admin@cheap4u.com', 'muhammadibrahim3766@gmail.com'];
  if (!user || (!ADMIN_EMAILS.includes((user.email || '').toLowerCase()) && user.role !== 'admin')) {
    alert('Admin access required');
    window.location.href = 'dashboard.html';
    return false;
  }
  return true;
}

async function loadProfit() {
  try {
    const res = await Api.admin.profit();
    const d = res.data;
    document.getElementById('availableProfit').textContent = Utils.money(d.available_balance ?? d.total_available);
    document.getElementById('totalEarned').textContent = `Total Earned: ${Utils.money(d.total_earned ?? d.total_profit)}`;

    const cats = d.by_category || d.profit_by_category || {};
    const box = document.getElementById('categoryBreakdown');
    const rows = Object.entries(cats).filter(([, v]) => v > 0);
    box.innerHTML = rows.length ? rows.map(([k, v]) => `
      <div class="summary-row"><span>${Utils.esc(CATEGORY_LABELS[k] || k.replace(/_/g, ' '))}</span><span>${Utils.money(v)}</span></div>
    `).join('') : `<div class="empty-state small">No profit recorded yet.</div>`;
  } catch (err) {
    Utils.toast('Could not load profit data: ' + err.message, 'error');
  }
}

async function loadWithdrawalHistory() {
  const box = document.getElementById('withdrawalHistory');
  try {
    const res = await Api.admin.withdrawals({});
    const rows = res.data || [];
    box.innerHTML = rows.length ? `<div class="card">` + rows.map(w => `
      <div class="txn-row">
        <div class="txn-row__icon">🏦</div>
        <div class="txn-row__body">
          <div class="txn-row__title">${Utils.esc(w.bank_name)} — ${Utils.esc(w.account_name)}</div>
          <div class="txn-row__meta">${Utils.esc(w.account_number)} · ${Utils.dateFmt(w.created_at)}</div>
        </div>
        <div>
          <div class="txn-row__amount">${Utils.money(w.amount)}</div>
          <div style="text-align:right;margin-top:4px;">${Utils.statusBadge(w.status)}</div>
        </div>
      </div>`).join('') + `</div>` : `<div class="card"><div class="empty-state small">No withdrawal history</div></div>`;
  } catch (err) {
    box.innerHTML = `<div class="card"><div class="empty-state small">Could not load withdrawal history.</div></div>`;
  }
}

document.getElementById('refreshBtn')?.addEventListener('click', () => { loadProfit(); loadWithdrawalHistory(); });

Auth.guard(async () => {
  if (!checkAdmin()) return;
  await loadProfit();
  await loadWithdrawalHistory();
});
