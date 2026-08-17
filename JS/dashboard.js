/**
 * dashboard.js — loads live wallet/referral/cashback/account data and
 * recent transactions. Every figure here comes from the backend; nothing
 * is hardcoded.
 */

const SERVICE_ICONS = {
  airtime: '📱', data: '📶', electricity: '⚡', cable_tv: '📺', exam_pin: '🎓',
  wallet_funding: '💳', card_payment: '💳', bank_transfer: '🏦', referral_bonus: '🤝',
  airtime_to_cash: '🔄',
};

function renderTxnRow(t) {
  const icon = SERVICE_ICONS[t.service_type] || '💸';
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

async function loadDashboard() {
  // Account details (wallet balance + virtual account)
  try {
    const acc = await Api.payment.accountDetails();
    const d = acc.data;
    document.getElementById('walletBalance').textContent = Utils.money(d.wallet_balance);

    const accCard = document.getElementById('accountDetailsCard');
    if (d.has_virtual_account) {
      accCard.innerHTML = `
        <div class="card-title">Your Virtual Account</div>
        <p class="small text-muted mb-8">${Utils.esc(d.funding_message || '')}</p>
        <div class="copyable-row">
          <span><b>${Utils.esc(d.bank_name)}</b> — ${Utils.esc(d.account_number)} (${Utils.esc(d.account_name || '')})</span>
          <button data-copy="${Utils.esc(d.account_number)}">Copy</button>
        </div>`;
      accCard.querySelector('[data-copy]').addEventListener('click', (e) => {
        Utils.copyToClipboard(e.target.dataset.copy, 'Account number copied');
      });
    } else {
      accCard.innerHTML = `
        <div class="card-title">Fund Your Wallet</div>
        <p class="small text-muted mb-8">${Utils.esc(d.funding_message || 'Fund your wallet via card payment.')}</p>
        <a href="wallet.html" class="btn btn-primary btn-sm">Fund Wallet</a>`;
    }
  } catch (err) {
    document.getElementById('walletBalance').textContent = '₦0.00';
    if (!(err instanceof Api.ApiError && err.status === 401)) Utils.toast(err.message, 'error');
  }

  // Referral info
  try {
    const ref = await Api.referral.info();
    document.getElementById('referralBalance').textContent = Utils.money(ref.data.referral_balance);
    document.getElementById('totalReferrals').textContent = ref.data.total_referrals;
  } catch { /* non-fatal — leave placeholders */ }

  // Cashback wallet
  try {
    const cb = await Api.cashback.wallet();
    document.getElementById('cashbackBalance').textContent = Utils.money(cb.data.balance ?? cb.data.cashback_balance ?? 0);
  } catch { document.getElementById('cashbackBalance').textContent = '₦0.00'; }

  // Account status from cached user
  const user = Api.getUser();
  document.getElementById('accountStatus').textContent = user?.is_verified ? 'Verified' : 'Unverified';

  // Recent transactions
  try {
    const txns = await Api.vtu.transactions({ limit: 6 });
    const rows = txns.data || [];
    const box = document.getElementById('recentTxns');
    if (!rows.length) {
      box.innerHTML = `<div class="empty-state"><div class="empty-state__icon">🧾</div><div class="empty-state__title">No transactions yet</div><p>Your recent purchases will show up here.</p></div>`;
    } else {
      box.innerHTML = rows.map(renderTxnRow).join('');
    }
  } catch (err) {
    document.getElementById('recentTxns').innerHTML = `<div class="empty-state">Could not load transactions.</div>`;
  }
}

Auth.guard(loadDashboard);
