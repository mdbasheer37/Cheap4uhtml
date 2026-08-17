/**
 * merchant.js — Merchant program via /api/merchant/* (merchant_routes.py).
 * Bulk jobs accept a real `items` array — each line the user types in the
 * bulk textarea is parsed into one item using the exact field names
 * merchant.py's _dispatch_single() expects per job type (confirmed from
 * source, including the "exam_name" vs customer-route "exam_type"
 * discrepancy for exam pins). No transaction PIN is required for merchant
 * bulk purchases — the backend authorizes via the merchant's JWT + approved
 * status only, matching merchant_routes.py exactly.
 */

const BULK_FIELD_HINTS = {
  airtime: 'network,phone,amount  (e.g. MTN,08012345678,500)',
  data: 'plan_id,phone  (e.g. 12,08012345678)',
  electricity: 'disco,meter_number,meter_type,amount,phone',
  cable_tv: 'plan_id,smartcard,phone',
  exam_pin: 'exam_name,quantity,selling_price  (e.g. WAEC,1,3500)',
};

function parseBulkLines(jobType, text) {
  const keys = {
    airtime: ['network', 'phone', 'amount'],
    data: ['plan_id', 'phone'],
    electricity: ['disco', 'meter_number', 'meter_type', 'amount', 'phone'],
    cable_tv: ['plan_id', 'smartcard', 'phone'],
    exam_pin: ['exam_name', 'quantity', 'selling_price'],
  }[jobType];
  return text.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const parts = line.split(',').map(p => p.trim());
    const item = {};
    keys.forEach((k, i) => { item[k] = parts[i]; });
    return item;
  });
}

async function renderApplyForm(box) {
  box.innerHTML = `
    <div class="empty-state">
      <div class="empty-state__icon">🏪</div>
      <div class="empty-state__title">Become a Merchant</div>
      <p>Apply for a merchant account to unlock bulk purchases and profit analytics.</p>
    </div>
    <div class="card">
      <div class="field">
        <label for="bizName">Business name</label>
        <input class="input" type="text" id="bizName" required>
      </div>
      <div class="field">
        <label for="bizType">Business type</label>
        <select class="input" id="bizType">
          <option value="individual">Individual</option>
          <option value="registered_business">Registered Business</option>
        </select>
      </div>
      <div class="field">
        <label for="bizPhone">Business phone <span class="text-muted">(optional)</span></label>
        <input class="input" type="tel" id="bizPhone">
      </div>
      <div class="field">
        <label for="bizAddress">Business address <span class="text-muted">(optional)</span></label>
        <input class="input" type="text" id="bizAddress">
      </div>
      <button class="btn btn-primary btn-block" id="applyBtn">Submit Application</button>
    </div>`;

  document.getElementById('applyBtn').addEventListener('click', async () => {
    const business_name = document.getElementById('bizName').value.trim();
    if (!business_name) { Utils.toast('Business name is required', 'error'); return; }
    const btn = document.getElementById('applyBtn');
    Utils.setButtonLoading(btn, true, 'Submitting…');
    try {
      const res = await Api.merchant.apply({
        business_name,
        business_type: document.getElementById('bizType').value,
        business_phone: document.getElementById('bizPhone').value.trim() || undefined,
        business_address: document.getElementById('bizAddress').value.trim() || undefined,
      });
      Utils.toast(res.message || 'Application submitted', 'success');
      loadMerchant();
    } catch (err) {
      Utils.toast(err.message, 'error');
    } finally {
      Utils.setButtonLoading(btn, false);
    }
  });
}

function renderPendingOrRejected(box, profile) {
  const statusMsg = {
    pending: 'Your merchant application is under review.',
    rejected: `Your application was rejected: ${profile.rejection_reason || 'no reason given'}`,
    suspended: 'Your merchant account has been suspended.',
  }[profile.status] || '';
  box.innerHTML = `<div class="card"><div class="empty-state">
    <div class="empty-state__icon">🏪</div>
    <div class="empty-state__title">${Utils.esc(profile.business_name)}</div>
    <p>${Utils.esc(statusMsg)}</p>
  </div></div>`;
}

async function renderApprovedMerchant(box, profile) {
  let walletHtml = '';
  try {
    const w = await Api.merchant.wallet();
    walletHtml = `<div class="stat-row">
      <div class="stat-card"><div class="stat-card__label">Total Profit</div><div class="stat-card__value">${Utils.money(w.data.total_profit ?? 0)}</div></div>
      <div class="stat-card"><div class="stat-card__label">Total Transactions</div><div class="stat-card__value">${w.data.total_transactions ?? '—'}</div></div>
    </div>`;
  } catch { /* non-fatal */ }

  box.innerHTML = `
    <div class="card mb-16">
      <div class="card-title">${Utils.esc(profile.business_name)}</div>
      <p class="badge badge--success">Approved Merchant</p>
    </div>
    ${walletHtml}
    <div class="card mb-16">
      <div class="card-title">Bulk Purchase</div>
      <div class="field">
        <label for="bulkJobType">Job type</label>
        <select class="input" id="bulkJobType">
          <option value="airtime">Airtime</option>
          <option value="data">Data</option>
          <option value="electricity">Electricity</option>
          <option value="cable_tv">Cable TV</option>
          <option value="exam_pin">Exam PIN</option>
        </select>
      </div>
      <div class="field">
        <label for="bulkItems">One item per line</label>
        <textarea class="input" id="bulkItems" rows="5" placeholder="${BULK_FIELD_HINTS.airtime}"></textarea>
        <div class="field-hint" id="bulkHint">${BULK_FIELD_HINTS.airtime}</div>
      </div>
      <button class="btn btn-primary btn-block" id="submitBulkBtn">Process Batch</button>
    </div>
    <div class="section-title" style="padding-left:0;">Recent Bulk Jobs</div>
    <div id="bulkJobsList"><div class="skel" style="height:60px;"></div></div>`;

  document.getElementById('bulkJobType').addEventListener('change', (e) => {
    const hint = BULK_FIELD_HINTS[e.target.value];
    document.getElementById('bulkHint').textContent = hint;
    document.getElementById('bulkItems').placeholder = hint;
  });

  document.getElementById('submitBulkBtn').addEventListener('click', async () => {
    const jobType = document.getElementById('bulkJobType').value;
    const items = parseBulkLines(jobType, document.getElementById('bulkItems').value);
    if (!items.length) { Utils.toast('Enter at least one item', 'error'); return; }
    const btn = document.getElementById('submitBulkBtn');
    Utils.setButtonLoading(btn, true, 'Processing…');
    try {
      const fnMap = {
        airtime: Api.merchant.bulkAirtime, data: Api.merchant.bulkData,
        electricity: Api.merchant.bulkElectricity, cable_tv: Api.merchant.bulkCableTv,
        exam_pin: Api.merchant.bulkExamPin,
      };
      const res = await fnMap[jobType]({ items });
      Utils.toast(`${res.data.success_count} succeeded, ${res.data.failed_count} failed`, 'success');
      document.getElementById('bulkItems').value = '';
      loadBulkJobs();
    } catch (err) {
      Utils.toast(err.message, 'error');
    } finally {
      Utils.setButtonLoading(btn, false);
    }
  });

  loadBulkJobs();
}

async function loadBulkJobs() {
  const box = document.getElementById('bulkJobsList');
  if (!box) return;
  try {
    const res = await Api.merchant.bulkJobs({ per_page: 10 });
    const rows = res.data.jobs || res.data || [];
    box.innerHTML = rows.length ? `<div class="card">` + rows.map(j => `
      <div class="txn-row">
        <div class="txn-row__icon">📦</div>
        <div class="txn-row__body">
          <div class="txn-row__title">${Utils.esc(j.job_type)}</div>
          <div class="txn-row__meta">${j.success_count}/${j.total_items} succeeded · ${Utils.dateFmt(j.created_at)}</div>
        </div>
        <div class="txn-row__amount">${Utils.money(j.total_amount_charged)}</div>
      </div>`).join('') + `</div>` : `<div class="card"><div class="empty-state small">No bulk jobs yet.</div></div>`;
  } catch (err) {
    box.innerHTML = `<div class="empty-state small">Could not load bulk jobs.</div>`;
  }
}

async function loadMerchant() {
  const box = document.getElementById('merchantContent');
  try {
    const res = await Api.merchant.profile();
    const profile = res.data;
    if (!profile) { renderApplyForm(box); return; }
    if (profile.status === 'approved') renderApprovedMerchant(box, profile);
    else renderPendingOrRejected(box, profile);
  } catch (err) {
    if (err.status === 404) {
      renderApplyForm(box);
    } else {
      box.innerHTML = `<div class="empty-state">Could not load merchant status: ${Utils.esc(err.message)}</div>`;
    }
  }
}

Auth.guard(loadMerchant);
