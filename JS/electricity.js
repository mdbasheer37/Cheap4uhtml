/**
 * electricity.js — Pay Electricity page. Providers are fetched live from
 * GET /api/plans/electricity-providers (never hardcoded). Purchase via
 * POST /api/vtpass/electricity { disco, meter_number, meter_type, amount,
 * phone, pin, coupon_code }.
 *
 * KNOWN BACKEND DATA ISSUE (documented, not silently patched — see
 * instructions): the provider names seeded in ElectricityProvider
 * (init_plans.py, e.g. "Eko Electric (EKEDC)") do not exactly match the
 * keys in cheapdatahub.py's DISCO_ID_MAP (e.g. "Eko Electric"), and the
 * numeric provider_ids used in each list are assigned in a different
 * order to different discos. As a result, a purchase using the exact
 * provider name returned by /api/plans/electricity-providers may be
 * rejected by the backend with "Unknown electricity provider: ...". This
 * is a backend data-seeding mismatch between two independently maintained
 * lists, not a frontend bug — the frontend sends exactly the provider
 * name the backend gave it.
 */

let selectedMeterType = 'prepaid';

function resetForm() {
  document.getElementById('formCard').classList.remove('hidden');
  document.getElementById('resultCard').classList.add('hidden');
}

function renderMeterTypeChips() {
  const row = document.getElementById('meterTypeChips');
  row.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      row.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedMeterType = chip.dataset.type;
    });
  });
}

async function loadProviders() {
  const select = document.getElementById('disco');
  try {
    const res = await Api.plans.electricityProviders();
    const providers = res.data || [];
    if (!providers.length) {
      select.innerHTML = `<option value="">No providers available</option>`;
      return;
    }
    select.innerHTML = `<option value="">Select a provider</option>` +
      providers.map(p => `<option value="${Utils.esc(p.name)}">${Utils.esc(p.name)}</option>`).join('');
  } catch (err) {
    select.innerHTML = `<option value="">Could not load providers</option>`;
    Utils.toast('Could not load electricity providers: ' + err.message, 'error');
  }
}

async function submitElectricity(e) {
  e.preventDefault();
  const disco = document.getElementById('disco').value;
  const meter_number = document.getElementById('meter').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const amount = Number(document.getElementById('amount').value);
  const coupon_code = document.getElementById('coupon').value.trim();

  let valid = true;
  const setErr = (id, ok) => { document.getElementById(id).classList.toggle('has-error', !ok); if (!ok) valid = false; };
  if (!disco) { Utils.toast('Please select a provider', 'error'); valid = false; }
  setErr('f-meter', meter_number.length >= 6 && /^\d+$/.test(meter_number));
  setErr('f-phone', Utils.isValidPhone(phone));
  setErr('f-amount', amount >= CONFIG.MIN_ELECTRICITY);
  if (!valid) return;

  const pin = await Purchase.requestPin();
  if (!pin) return;

  const btn = document.getElementById('submitBtn');
  Utils.setButtonLoading(btn, true, 'Processing…');
  try {
    const res = await Api.vtu.electricity({
      disco, meter_number, meter_type: selectedMeterType, amount, phone, pin, coupon_code,
    });
    const d = res.data || {};
    document.getElementById('formCard').classList.add('hidden');
    const resultCard = document.getElementById('resultCard');
    resultCard.classList.remove('hidden');
    Purchase.renderSuccess(resultCard, {
      title: 'Electricity Payment Successful',
      message: `₦${d.amount_charged ?? amount} paid to ${disco}.`,
      rows: [
        { label: 'Token', value: d.token || 'N/A', copy: !!d.token },
        { label: 'Units', value: d.units || 'N/A' },
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
  renderMeterTypeChips();
  document.getElementById('electricityForm').addEventListener('submit', submitElectricity);
  await loadProviders();
});
