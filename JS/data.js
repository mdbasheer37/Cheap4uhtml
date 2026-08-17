/**
 * data.js — Buy Data page. Plans are fetched live from
 * GET /api/plans/data (never hardcoded), filtered by network + plan_type
 * client-side. Purchase via POST /api/vtpass/data { plan_id, phone, pin, coupon_code }.
 */

let allDataPlans = [];
let selectedNetwork = null;
let selectedPlanType = null;
let selectedPlan = null;

function resetForm() {
  document.getElementById('formCard').classList.remove('hidden');
  document.getElementById('resultCard').classList.add('hidden');
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
      selectedNetwork = el.dataset.network;
      selectedPlan = null;
      renderPlanTypeChips();
      renderPlans();
    });
  });
}

function renderPlanTypeChips() {
  const row = document.getElementById('planTypeChips');
  if (!selectedNetwork) { row.innerHTML = ''; return; }
  const types = [...new Set(allDataPlans
    .filter(p => (p.provider || '').toUpperCase() === selectedNetwork.toUpperCase())
    .map(p => p.type || 'Gifting'))];
  if (!types.length) { row.innerHTML = ''; return; }
  if (!selectedPlanType || !types.includes(selectedPlanType)) selectedPlanType = types[0];
  row.innerHTML = types.map(t => `<div class="chip ${t === selectedPlanType ? 'active' : ''}" data-type="${Utils.esc(t)}">${Utils.esc(t)}</div>`).join('');
  row.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      selectedPlanType = chip.dataset.type;
      selectedPlan = null;
      renderPlanTypeChips();
      renderPlans();
    });
  });
}

function renderPlans() {
  const box = document.getElementById('plansContainer');
  if (!selectedNetwork) {
    box.innerHTML = `<div class="empty-state small">Select a network to see available data plans.</div>`;
    updateSubmitState();
    return;
  }
  const plans = allDataPlans.filter(p =>
    (p.provider || '').toUpperCase() === selectedNetwork.toUpperCase() &&
    (p.type || 'Gifting') === selectedPlanType
  );
  if (!plans.length) {
    box.innerHTML = `<div class="empty-state small">No plans available for ${Utils.esc(selectedNetwork)} right now.</div>`;
    updateSubmitState();
    return;
  }
  box.innerHTML = `<div class="plan-list">` + plans.map(p => `
    <div class="plan-item" data-plan-id="${p.plan_id}">
      <div>
        <div class="plan-item__name">${Utils.esc(p.size || '')}</div>
        <div class="plan-item__sub">${Utils.esc(p.duration || '')}</div>
      </div>
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
    btn.textContent = `Buy for ${Utils.money(selectedPlan.selling_price)}`;
  } else {
    btn.disabled = true;
    btn.textContent = 'Select a plan to continue';
  }
}

async function submitData(e) {
  e.preventDefault();
  const phone = document.getElementById('phone').value.trim();
  const coupon_code = document.getElementById('coupon').value.trim();

  let valid = true;
  const setErr = (id, ok) => { document.getElementById(id).classList.toggle('has-error', !ok); if (!ok) valid = false; };
  setErr('f-phone', Utils.isValidPhone(phone));
  if (!selectedPlan) { Utils.toast('Please select a data plan', 'error'); valid = false; }
  if (!valid) return;

  const pin = await Purchase.requestPin();
  if (!pin) return;

  const btn = document.getElementById('submitBtn');
  Utils.setButtonLoading(btn, true, 'Processing…');
  try {
    const res = await Api.vtu.data({ plan_id: selectedPlan.plan_id, phone, pin, coupon_code });
    const d = res.data || {};
    document.getElementById('formCard').classList.add('hidden');
    const resultCard = document.getElementById('resultCard');
    resultCard.classList.remove('hidden');
    Purchase.renderSuccess(resultCard, {
      title: 'Data Purchase Successful',
      message: `${selectedPlan.size} (${selectedPlan.duration}) sent to ${phone}.`,
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
  document.getElementById('dataForm').addEventListener('submit', submitData);
  try {
    const res = await Api.plans.data();
    allDataPlans = res.data || [];
    renderPlans();
  } catch (err) {
    document.getElementById('plansContainer').innerHTML = `<div class="empty-state small">Could not load data plans: ${Utils.esc(err.message)}</div>`;
  }
});
