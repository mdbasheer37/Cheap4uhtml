/**
 * airtime-to-cash.js — 4-step wizard exactly matching the backend's real
 * flow (routes.py a2c_bp + airtime_to_cash.py):
 *   1. generate-otp { network, phone }
 *   2. verify-otp { network, phone, otp } → session_id, airtime_balance
 *   3. check-quota { network, amount }
 *   4. transfer { network, phone, amount, sim_pin, session_id }
 * Note: step 4 uses the user's carrier SIM transfer PIN, NOT the Cheap4U
 * wallet transaction PIN — the backend does not check the wallet PIN here.
 */

let a2cState = { network: null, phone: '', otp: '', sessionId: null, amount: 0 };

function showStep(n) {
  [1, 2, 3, 4].forEach(i => document.getElementById(`step${i}`).classList.toggle('hidden', i !== n));
  document.getElementById('stepTitle').textContent = `Step ${n} of 4 — ${
    ['', 'Select Network & Phone', 'Verify OTP', 'Enter Amount', 'Confirm Transfer'][n]
  }`;
}

function renderNetworkGrid() {
  const grid = document.getElementById('networkGrid');
  grid.innerHTML = CONFIG.NETWORKS.map(n => `
    <div class="provider-item" data-network="${n}">
      <img src="${NETWORK_LOGOS[n]}" alt="${n}" onerror="this.style.display='none'">
      <span>${n}</span>
    </div>`).join('');
  grid.querySelectorAll('.provider-item').forEach(el => {
    el.addEventListener('click', () => {
      grid.querySelectorAll('.provider-item').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
      a2cState.network = el.dataset.network;
    });
  });
}

async function sendOtp() {
  const phone = document.getElementById('phone').value.trim();
  document.getElementById('f-phone').classList.toggle('has-error', !Utils.isValidPhone(phone));
  if (!a2cState.network) { Utils.toast('Select a network', 'error'); return; }
  if (!Utils.isValidPhone(phone)) return;
  a2cState.phone = phone;

  const btn = document.getElementById('sendOtpBtn');
  Utils.setButtonLoading(btn, true, 'Sending OTP…');
  try {
    const res = await Api.airtimeToCash.generateOtp({ network: a2cState.network, phone });
    Utils.toast(res.message || 'OTP sent', 'success');
    showStep(2);
  } catch (err) {
    Utils.toast(err.message, 'error');
  } finally {
    Utils.setButtonLoading(btn, false);
  }
}

async function verifyOtp() {
  const otp = document.getElementById('otpInput').value.trim();
  document.getElementById('f-otp').classList.toggle('has-error', !/^\d{4,6}$/.test(otp));
  if (!/^\d{4,6}$/.test(otp)) return;

  const btn = document.getElementById('verifyOtpBtn');
  Utils.setButtonLoading(btn, true, 'Verifying…');
  try {
    const res = await Api.airtimeToCash.verifyOtp({ network: a2cState.network, phone: a2cState.phone, otp });
    a2cState.sessionId = res.data.session_id;
    document.getElementById('airtimeBalance').textContent = res.data.airtime_balance ?? 'N/A';
    Utils.toast('Phone verified!', 'success');
    showStep(3);
  } catch (err) {
    Utils.toast(err.message, 'error');
  } finally {
    Utils.setButtonLoading(btn, false);
  }
}

async function checkQuota() {
  const amount = Number(document.getElementById('amount').value);
  document.getElementById('f-amount').classList.toggle('has-error', !(amount > 0));
  if (!(amount > 0)) return;
  a2cState.amount = amount;

  const btn = document.getElementById('checkQuotaBtn');
  Utils.setButtonLoading(btn, true, 'Checking…');
  try {
    const res = await Api.airtimeToCash.checkQuota({ network: a2cState.network, amount });
    Utils.toast(res.message || 'Recipients available', 'success');
    showStep(4);
  } catch (err) {
    Utils.toast(err.message, 'error');
  } finally {
    Utils.setButtonLoading(btn, false);
  }
}

async function submitTransfer() {
  const sim_pin = document.getElementById('simPin').value.trim();
  document.getElementById('f-simpin').classList.toggle('has-error', !sim_pin);
  if (!sim_pin) return;

  const btn = document.getElementById('transferBtn');
  Utils.setButtonLoading(btn, true, 'Processing…');
  try {
    const res = await Api.airtimeToCash.transfer({
      network: a2cState.network, phone: a2cState.phone, amount: a2cState.amount,
      sim_pin, session_id: a2cState.sessionId,
    });
    const d = res.data || {};
    document.getElementById('formCard').classList.add('hidden');
    const resultCard = document.getElementById('resultCard');
    resultCard.classList.remove('hidden');
    Purchase.renderSuccess(resultCard, {
      title: 'Airtime Converted Successfully',
      message: `${Utils.money(d.converted_amount)} airtime converted, ${Utils.money(d.credited_amount)} credited to your wallet.`,
      rows: [
        { label: 'Reference', value: d.reference || '—', copy: true },
        { label: 'New Wallet Balance', value: Utils.money(d.new_balance) },
      ],
    });
    loadA2cHistory();
  } catch (err) {
    document.getElementById('formCard').classList.add('hidden');
    const resultCard = document.getElementById('resultCard');
    resultCard.classList.remove('hidden');
    Purchase.renderError(resultCard, err.message, () => {
      document.getElementById('formCard').classList.remove('hidden');
      resultCard.classList.add('hidden');
      showStep(1);
    });
  } finally {
    Utils.setButtonLoading(btn, false);
  }
}

async function loadA2cHistory() {
  const box = document.getElementById('a2cHistory');
  try {
    const res = await Api.vtu.transactions({ service_type: 'airtime_to_cash', limit: 15 });
    const rows = res.data || [];
    box.innerHTML = rows.length ? rows.map(t => `
      <div class="txn-row">
        <div class="txn-row__icon">🔄</div>
        <div class="txn-row__body">
          <div class="txn-row__title">Airtime to Cash</div>
          <div class="txn-row__meta">${Utils.esc(t.reference || '')} · ${Utils.dateFmt(t.created_at)}</div>
        </div>
        <div>
          <div class="txn-row__amount">${Utils.money(t.amount)}</div>
          <div style="text-align:right;margin-top:4px;">${Utils.statusBadge(t.status)}</div>
        </div>
      </div>`).join('') : `<div class="empty-state small">No conversions yet.</div>`;
  } catch {
    box.innerHTML = `<div class="empty-state small">Could not load history.</div>`;
  }
}

Auth.guard(async () => {
  renderNetworkGrid();
  document.getElementById('sendOtpBtn').addEventListener('click', sendOtp);
  document.getElementById('verifyOtpBtn').addEventListener('click', verifyOtp);
  document.getElementById('checkQuotaBtn').addEventListener('click', checkQuota);
  document.getElementById('transferBtn').addEventListener('click', submitTransfer);
  showStep(1);
  await loadA2cHistory();
});
