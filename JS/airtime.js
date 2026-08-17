/**
 * airtime.js — Buy Airtime page. Uses Api.vtu.airtime → POST /api/vtpass/airtime.
 * Body: { network, phone, amount, pin, coupon_code }
 */

let selectedNetwork = null;

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
      selectedNetwork = el.dataset.network;
    });
  });
}

function renderQuickAmounts() {
  const row = document.getElementById('quickAmounts');
  const amounts = [100, 200, 500, 1000, 2000, 5000];
  row.innerHTML = amounts.map(a => `<div class="chip" data-amount="${a}">₦${a}</div>`).join('');
  row.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      row.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      document.getElementById('amount').value = chip.dataset.amount;
    });
  });
}

function resetForm() {
  document.getElementById('formCard').classList.remove('hidden');
  document.getElementById('resultCard').classList.add('hidden');
}

async function submitAirtime(e) {
  e.preventDefault();
  const phone = document.getElementById('phone').value.trim();
  const amount = Number(document.getElementById('amount').value);
  const coupon_code = document.getElementById('coupon').value.trim();

  let valid = true;
  const setErr = (id, ok) => { document.getElementById(id).classList.toggle('has-error', !ok); if (!ok) valid = false; };
  setErr('f-phone', Utils.isValidPhone(phone));
  setErr('f-amount', amount >= CONFIG.MIN_AIRTIME);
  if (!selectedNetwork) { Utils.toast('Please select a network', 'error'); valid = false; }
  if (!valid) return;

  const pin = await Purchase.requestPin();
  if (!pin) return;

  const btn = document.getElementById('submitBtn');
  Utils.setButtonLoading(btn, true, 'Processing…');
  try {
    const res = await Api.vtu.airtime({ network: selectedNetwork, phone, amount, pin, coupon_code });
    const d = res.data || {};
    document.getElementById('formCard').classList.add('hidden');
    const resultCard = document.getElementById('resultCard');
    resultCard.classList.remove('hidden');
    Purchase.renderSuccess(resultCard, {
      title: 'Airtime Purchase Successful',
      message: `₦${d.amount_charged ?? amount} airtime sent to ${phone} (${selectedNetwork}).`,
      rows: [
        { label: 'Reference', value: d.reference || '—', copy: true },
        { label: 'New Wallet Balance', value: Utils.money(d.new_balance) },
      ],
    });
  } catch (err) {
    document.getElementById('formCard').classList.add('hidden');
    const resultCard = document.getElementById('resultCard');
    resultCard.classList.remove('hidden');
    Purchase.renderError(resultCard, err.message, resetForm);
  } finally {
    Utils.setButtonLoading(btn, false);
  }
}

Auth.guard(async () => {
  renderNetworkGrid();
  renderQuickAmounts();
  document.getElementById('airtimeForm').addEventListener('submit', submitAirtime);
});
