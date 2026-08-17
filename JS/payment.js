/**
 * payment.js — Fund Wallet page.
 *
 * Flow (matches payment.py exactly): POST /api/payment/initialize returns
 * a Paystack authorization_url + reference. The backend's callback_url
 * points at the FLASK backend itself (not this frontend), so Paystack's
 * post-payment redirect lands on the backend's own static confirmation
 * page — the frontend can't intercept that redirect. Instead we open the
 * checkout in a new tab, remember the reference locally, and let the user
 * come back and confirm — at which point we call
 * GET /api/payment/verify/<reference> to authoritatively check status and
 * credit-refresh the wallet balance shown here.
 */

const PENDING_REF_KEY = 'c4u_pending_payment_ref';

function renderAccountCard(d) {
  const card = document.getElementById('virtualAccountCard');
  if (d.has_virtual_account) {
    card.innerHTML = `
      <div class="card-title">Fund via Bank Transfer</div>
      <p class="small text-muted mb-8">${Utils.esc(d.funding_message || '')}</p>
      <div class="copyable-row">
        <span><b>${Utils.esc(d.bank_name)}</b> — ${Utils.esc(d.account_number)}<br>${Utils.esc(d.account_name || '')}</span>
        <button data-copy="${Utils.esc(d.account_number)}">Copy</button>
      </div>`;
    card.querySelector('[data-copy]').addEventListener('click', (e) => {
      Utils.copyToClipboard(e.target.dataset.copy, 'Account number copied');
    });
  } else {
    card.innerHTML = `
      <div class="card-title">Bank Transfer</div>
      <p class="small text-muted">${Utils.esc(d.funding_message || 'Bank transfer is not available on your account yet — use card funding below.')}</p>`;
  }
}

async function refreshBalance() {
  try {
    const res = await Api.payment.accountDetails();
    document.getElementById('walletBalance').textContent = Utils.money(res.data.wallet_balance);
    renderAccountCard(res.data);
    const user = Api.getUser();
    if (user) { user.wallet_balance = res.data.wallet_balance; Api.setSession(null, user); }
  } catch (err) {
    document.getElementById('walletBalance').textContent = '₦0.00';
  }
}

function renderQuickAmounts() {
  const row = document.getElementById('quickAmounts');
  const amounts = [1000, 2000, 5000, 10000, 20000, 50000];
  row.innerHTML = amounts.map(a => `<div class="chip" data-amount="${a}">₦${a.toLocaleString()}</div>`).join('');
  row.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      row.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      document.getElementById('amount').value = chip.dataset.amount;
    });
  });
}

async function checkPendingPayment() {
  const ref = localStorage.getItem(PENDING_REF_KEY);
  if (!ref) return;
  try {
    const res = await Api.payment.verify(ref);
    localStorage.removeItem(PENDING_REF_KEY);
    if (res.status === 'success') {
      Utils.toast(res.message || 'Wallet funded successfully!', 'success', 5000);
      refreshBalance();
    }
  } catch (err) {
    localStorage.removeItem(PENDING_REF_KEY);
    // Silently drop — user may not have completed that payment.
  }
}

async function submitFund(e) {
  e.preventDefault();
  const amount = Number(document.getElementById('amount').value);
  const valid = amount >= CONFIG.MIN_FUNDING && amount <= CONFIG.MAX_FUNDING;
  document.getElementById('f-amount').classList.toggle('has-error', !valid);
  if (!valid) return;

  const btn = document.getElementById('fundBtn');
  Utils.setButtonLoading(btn, true, 'Preparing checkout…');
  try {
    const res = await Api.payment.initialize({ amount });
    const d = res.data;
    localStorage.setItem(PENDING_REF_KEY, d.reference);
    Utils.toast('Redirecting to secure payment page…', 'info', 2500);
    window.open(d.authorization_url, '_blank');
    Utils.toast('After paying, come back here and we will confirm your funding automatically.', 'info', 6000);
  } catch (err) {
    Utils.toast(err.message, 'error');
  } finally {
    Utils.setButtonLoading(btn, false);
  }
}

Auth.guard(async () => {
  renderQuickAmounts();
  document.getElementById('fundForm').addEventListener('submit', submitFund);
  await refreshBalance();
  await checkPendingPayment();
  // Re-check when the user returns to this tab after completing checkout.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkPendingPayment();
  });
});
