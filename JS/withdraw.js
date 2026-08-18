/**
 * withdraw.js — Withdraw Profit form via /api/admin/banks and
 * /api/admin/profit/withdraw. Admin-only, gated same as profit.js.
 */

let selectedBank = null;
let allBanks = [];

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

async function loadAvailableBalance() {
  try {
    const res = await Api.admin.profit();
    document.getElementById('availableBalance').textContent = Utils.money(res.data.available_balance ?? res.data.total_available);
  } catch (err) {
    document.getElementById('availableBalance').textContent = '₦0.00';
  }
}

function renderBankList(filter = '') {
  const box = document.getElementById('bankList');
  const filtered = allBanks.filter(b => b.name.toLowerCase().includes(filter.toLowerCase()));
  box.innerHTML = filtered.length ? filtered.map(b => `
    <div class="menu-item" data-code="${b.code}" data-name="${Utils.esc(b.name)}" style="padding:12px 4px;cursor:pointer;">
      <span>${Utils.esc(b.name)}</span>
    </div>`).join('') : `<div class="empty-state small">No banks found</div>`;
  box.querySelectorAll('[data-code]').forEach(el => {
    el.addEventListener('click', () => {
      selectedBank = { code: el.dataset.code, name: el.dataset.name };
      document.getElementById('bankDisplay').value = el.dataset.name;
      Utils.closeModal('bankModal');
    });
  });
}

document.getElementById('bankDisplay').addEventListener('click', async () => {
  Utils.openModal('bankModal');
  if (!allBanks.length) {
    try {
      const res = await Api.admin.banks();
      allBanks = res.data || [];
      renderBankList();
    } catch (err) {
      document.getElementById('bankList').innerHTML = `<div class="empty-state small">Could not load banks: ${Utils.esc(err.message)}</div>`;
    }
  } else {
    renderBankList();
  }
});

document.getElementById('bankSearch').addEventListener('input', (e) => renderBankList(e.target.value));

document.getElementById('withdrawForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const amount = Number(document.getElementById('amount').value);
  const account_number = document.getElementById('accountNumber').value.trim();

  if (!(amount >= 100 && amount <= 500000)) { Utils.toast('Amount must be between ₦100 and ₦500,000', 'error'); return; }
  if (!selectedBank) { Utils.toast('Please select a bank', 'error'); return; }
  if (!/^\d{10}$/.test(account_number)) { Utils.toast('Enter a valid 10-digit account number', 'error'); return; }

  const btn = document.getElementById('withdrawBtn');
  Utils.setButtonLoading(btn, true, 'Processing…');
  try {
    const res = await Api.admin.withdraw({
      amount,
      bank_details: { account_number, bank_code: selectedBank.code, bank_name: selectedBank.name },
    });
    Utils.toast(res.message || 'Withdrawal processed', 'success');
    setTimeout(() => { window.location.href = 'profit.html'; }, 1500);
  } catch (err) {
    Utils.toast(err.message, 'error');
  } finally {
    Utils.setButtonLoading(btn, false);
  }
});

Auth.guard(async () => {
  if (!checkAdmin()) return;
  await loadAvailableBalance();
});
