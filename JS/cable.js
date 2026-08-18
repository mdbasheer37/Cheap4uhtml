/**
 * cable.js — Cable TV page. Plans fetched live from GET /api/plans/cable
 * (never hardcoded), grouped by provider. Purchase via
 * POST /api/vtpass/cable-tv { plan_id, smartcard, pin, coupon_code }.
 */

const CABLE_LOGOS = {
  DSTV: 'assets/dstv.png', GOTV: 'assets/gotv.png',
  STARTIMES: 'assets/startime.png', SHOWMAX: 'assets/showmax.png',
};

let allCablePlans = [];
let selectedProvider = null;
let selectedPlan = null;

function resetForm() {
  document.getElementById('formCard').classList.remove('hidden');
  document.getElementById('resultCard').classList.add('hidden');
}

function logoFor(provider) {
  const key = (provider || '').toUpperCase().replace(/\s+/g, '');
  return CABLE_LOGOS[key] || null;
}

function renderProviderGrid() {
  const providers = [...new Set(allCablePlans.map(p => p.provider))];
  const grid = document.getElementById('providerGrid');
  if (!providers.length) {
    grid.innerHTML = `<div class="empty-state small">No cable providers available.</div>`;
    return;
  }
  grid.innerHTML = providers.map(p => {
    const logo = logoFor(p);
    return `<div class="provider-item" data-provider="${Utils.esc(p)}">
      ${logo ? `<img src="${logo}" alt="${Utils.esc(p)}" onerror="this.style.display='none'">` : `<div style="font-size:20px;"><span class="material-symbols-outlined">tv</span></div>`}
      <span>${Utils.esc(p)}</span>
    </div>`;
  }).join('');
  grid.querySelectorAll('.provider-item').forEach(el => {
    el.addEventListener('click', () => {
      grid.querySelectorAll('.provider-item').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
      selectedProvider = el.dataset.provider;
      selectedPlan = null;
      renderPlans();
    });
  });
}

function renderPlans() {
  const box = document.getElementById('plansContainer');
  if (!selectedProvider) { box.innerHTML = ''; updateSubmitState(); return; }
  const plans = allCablePlans.filter(p => p.provider === selectedProvider);
  box.innerHTML = `<div class="plan-list">` + plans.map(p => `
    <div class="plan-item" data-plan-id="${p.plan_id}">
      <div class="plan-item__name">${Utils.esc(p.plan_name)}</div>
      <div class="plan-item__price">${Utils.money(p.selling_price)}</div>
    </div>`).join('') + `</div>`;
  box.querySelectorAll('.plan-item').forEach(el => {
    el.addEventListener('click', () => {
      box.querySelectorAll('.plan-item').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
      selectedPlan = plans.find(p => String(p.plan_id) === el.dataset.planId);
      updateSubmitState();
    });
  });
  updateSubmitState();
}

function updateSubmitState() {
  const btn = document.getElementById('submitBtn');
  if (selectedPlan) {
    btn.disabled = false;
    btn.textContent = `Subscribe for ${Utils.money(selectedPlan.selling_price)}`;
  } else {
    btn.disabled = true;
    btn.textContent = 'Select a plan to continue';
  }
}

async function submitCable(e) {
  e.preventDefault();
  const smartcard = document.getElementById('smartcard').value.trim();
  const coupon_code = document.getElementById('coupon').value.trim();

  let valid = true;
  document.getElementById('f-smartcard').classList.toggle('has-error', smartcard.length < 6);
  if (smartcard.length < 6) valid = false;
  if (!selectedPlan) { Utils.toast('Please select a plan', 'error'); valid = false; }
  if (!valid) return;

  const pin = await Purchase.requestPin();
  if (!pin) return;

  const btn = document.getElementById('submitBtn');
  Utils.setButtonLoading(btn, true, 'Processing…');
  try {
    const res = await Api.vtu.cableTv({ plan_id: selectedPlan.plan_id, smartcard, pin, coupon_code });
    const d = res.data || {};
    document.getElementById('formCard').classList.add('hidden');
    const resultCard = document.getElementById('resultCard');
    resultCard.classList.remove('hidden');
    Purchase.renderSuccess(resultCard, {
      title: 'Cable TV Subscription Successful',
      message: `${d.plan_name || selectedPlan.plan_name} activated for smartcard ${smartcard}.`,
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
  document.getElementById('cableForm').addEventListener('submit', submitCable);
  try {
    const res = await Api.plans.cable();
    allCablePlans = res.data || [];
    renderProviderGrid();
  } catch (err) {
    document.getElementById('providerGrid').innerHTML = `<div class="empty-state small">Could not load cable plans: ${Utils.esc(err.message)}</div>`;
  }
});
