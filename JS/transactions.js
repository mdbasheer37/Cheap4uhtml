/**
 * transactions.js — Transaction history via GET /api/vtpass/transactions.
 *
 * Notes on filtering/pagination (per spec §13, only implementing what the
 * backend genuinely supports):
 *  - service_type filtering is a REAL server-side query param on this
 *    endpoint, so the dropdown re-fetches from the backend.
 *  - The backend endpoint takes only a `limit` (no page/offset), so
 *    "Load more" re-requests with a larger limit — a real, backend-driven
 *    expansion of the result set, not fabricated pagination.
 *  - Status filtering and the reference search box filter the already-
 *    fetched real records client-side (the backend doesn't expose a
 *    status or free-text query param on this route).
 */

let currentLimit = 20;
let allLoaded = [];

const SERVICE_ICONS = {
  airtime: '📱', data: '📶', electricity: '⚡', cable_tv: '📺', exam_pin: '🎓',
  wallet_funding: '💳', card_payment: '💳', bank_transfer: '🏦', referral_bonus: '🤝',
  airtime_to_cash: '🔄',
};

function renderTxnRow(t) {
  const icon = SERVICE_ICONS[t.service_type] || SERVICE_ICONS[t.type] || '💸';
  const isCredit = t.type === 'wallet_funding';
  const label = (t.service_type || t.type || 'transaction').replace(/_/g, ' ');
  return `
    <div class="txn-row">
      <div class="txn-row__icon">${icon}</div>
      <div class="txn-row__body">
        <div class="txn-row__title">${Utils.esc(label)}</div>
        <div class="txn-row__meta">${Utils.esc(t.reference || '')} · ${Utils.dateFmt(t.created_at || t.date)}</div>
      </div>
      <div>
        <div class="txn-row__amount" style="color:${isCredit ? 'var(--green-600)' : 'var(--gray-900)'}">
          ${isCredit ? '+' : '-'}${Utils.money(t.amount)}
        </div>
        <div style="text-align:right;margin-top:4px;">${Utils.statusBadge(t.status)}</div>
      </div>
    </div>`;
}

function applyClientFilters(rows) {
  const status = document.getElementById('statusFilter').value;
  const search = document.getElementById('searchInput').value.trim().toLowerCase();
  return rows.filter(t => {
    if (status && (t.status || '').toLowerCase() !== status) return false;
    if (search && !(t.reference || '').toLowerCase().includes(search)) return false;
    return true;
  });
}

function renderList() {
  const box = document.getElementById('txnList');
  const filtered = applyClientFilters(allLoaded);
  if (!filtered.length) {
    box.innerHTML = `<div class="empty-state"><div class="empty-state__icon">🧾</div><div class="empty-state__title">No transactions found</div><p>Try adjusting your filters.</p></div>`;
    return;
  }
  box.innerHTML = filtered.map(renderTxnRow).join('');
}

async function fetchTransactions() {
  const box = document.getElementById('txnList');
  const service_type = document.getElementById('serviceFilter').value;
  try {
    const res = await Api.vtu.transactions({ limit: currentLimit, service_type: service_type || undefined });
    allLoaded = res.data || [];
    renderList();
    document.getElementById('loadMoreBtn').style.display = allLoaded.length < currentLimit ? 'none' : '';
  } catch (err) {
    box.innerHTML = `<div class="empty-state">Could not load transactions: ${Utils.esc(err.message)}</div>`;
  }
}

Auth.guard(async () => {
  document.getElementById('serviceFilter').addEventListener('change', () => { currentLimit = 20; fetchTransactions(); });
  document.getElementById('statusFilter').addEventListener('change', renderList);
  document.getElementById('searchInput').addEventListener('input', Utils.debounce(renderList, 200));
  document.getElementById('loadMoreBtn').addEventListener('click', () => { currentLimit += 20; fetchTransactions(); });
  await fetchTransactions();
});
