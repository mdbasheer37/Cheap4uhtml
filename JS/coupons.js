/**
 * coupons.js — Coupon validation + "My Coupons" (referral/admin-issued)
 * + Spin & Win coupons, via /api/coupons/* and /api/spin/coupons.
 * The backend remains authoritative for discount rules — this page only
 * previews what the backend computes.
 */

async function submitValidate(e) {
  e.preventDefault();
  const code = document.getElementById('couponCode').value.trim();
  const category = document.getElementById('couponCategory').value;
  const amount = Number(document.getElementById('couponAmount').value) || 0;
  const box = document.getElementById('validateResult');
  if (!code) { Utils.toast('Enter a coupon code', 'error'); return; }

  const btn = document.getElementById('validateBtn');
  Utils.setButtonLoading(btn, true, 'Checking…');
  try {
    const res = await Api.coupons.validate({ code, category: category || undefined, amount });
    const d = res.data;
    box.innerHTML = `
      <div class="empty-state" style="padding:16px;background:var(--green-50);border-radius:12px;color:var(--green-600);text-align:left;">
        <b>${Utils.esc(d.code)}</b> is valid — you save ${Utils.money(d.discount_amount)}.
        Final amount: ${Utils.money(d.final_amount)}.
      </div>`;
  } catch (err) {
    box.innerHTML = `<div class="empty-state" style="padding:16px;background:var(--red-50);border-radius:12px;color:var(--red-600);text-align:left;">${Utils.esc(err.message)}</div>`;
  } finally {
    Utils.setButtonLoading(btn, false);
  }
}

async function loadCoupons() {
  try {
    const res = await Api.coupons.myCoupons();
    const rows = res.data || [];
    const box = document.getElementById('myCoupons');
    box.innerHTML = rows.length ? rows.map(c => `
      <div class="txn-row">
        <div class="txn-row__icon"><span class="material-symbols-outlined">confirmation_number</span></div>
        <div class="txn-row__body">
          <div class="txn-row__title" style="text-transform:none;">${Utils.esc(c.code)}</div>
          <div class="txn-row__meta">${c.discount_type === 'percentage' ? c.discount_value + '% off' : Utils.money(c.discount_value) + ' off'}${c.expires_at ? ' · expires ' + Utils.dateFmt(c.expires_at) : ''}</div>
        </div>
        <button class="btn btn-outline btn-sm" data-copy-coupon="${Utils.esc(c.code)}">Copy</button>
      </div>`).join('') : `<div class="empty-state small">No personal coupons right now.</div>`;
    box.querySelectorAll('[data-copy-coupon]').forEach(b => b.addEventListener('click', () => Utils.copyToClipboard(b.dataset.copyCoupon, 'Coupon copied')));
  } catch {
    document.getElementById('myCoupons').innerHTML = `<div class="empty-state small">Could not load your coupons.</div>`;
  }

  try {
    const res = await Api.spin.coupons();
    const rows = res.data || [];
    const box = document.getElementById('spinCoupons');
    box.innerHTML = rows.length ? rows.map(c => `
      <div class="txn-row">
        <div class="txn-row__icon"><span class="material-symbols-outlined">casino</span></div>
        <div class="txn-row__body">
          <div class="txn-row__title" style="text-transform:none;">${Utils.esc(c.code)}</div>
          <div class="txn-row__meta">${Utils.money(c.discount_amount)} off${c.is_used ? ' · used' : ''}${c.expires_at ? ' · expires ' + Utils.dateFmt(c.expires_at) : ''}</div>
        </div>
        ${c.is_used ? Utils.statusBadge('failed').replace('Failed','Used') : `<button class="btn btn-outline btn-sm" data-copy-coupon="${Utils.esc(c.code)}">Copy</button>`}
      </div>`).join('') : `<div class="empty-state small">No Spin & Win coupons yet — try spinning the wheel!</div>`;
    box.querySelectorAll('[data-copy-coupon]').forEach(b => b.addEventListener('click', () => Utils.copyToClipboard(b.dataset.copyCoupon, 'Coupon copied')));
  } catch {
    document.getElementById('spinCoupons').innerHTML = `<div class="empty-state small">Could not load spin coupons.</div>`;
  }
}

Auth.guard(async () => {
  document.getElementById('validateForm').addEventListener('submit', submitValidate);
  await loadCoupons();
});
