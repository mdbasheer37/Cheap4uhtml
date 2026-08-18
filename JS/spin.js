/**
 * spin.js — Spin & Win. The backend (POST /api/spin/spin) determines the
 * winning segment BEFORE the wheel ever animates — this file only draws
 * the wheel from GET /api/spin/segments and rotates it to land on
 * whichever segment_id the backend's response says won. The frontend
 * never computes or guesses the outcome itself.
 */

let segments = [];
let currentRotation = 0;

function drawWheel() {
  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const cx = size / 2, cy = size / 2, r = size / 2 - 4;
  ctx.clearRect(0, 0, size, size);
  if (!segments.length) return;

  const sliceAngle = (2 * Math.PI) / segments.length;
  segments.forEach((seg, i) => {
    const start = i * sliceAngle;
    const end = start + sliceAngle;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = seg.color || '#2196F3';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText((seg.label || '').slice(0, 14), r - 12, 4);
    ctx.restore();
  });
}

async function loadStatusAndSegments() {
  try {
    const res = await Api.spin.segments();
    segments = res.data || [];
    drawWheel();
  } catch (err) {
    Utils.toast('Could not load the wheel: ' + err.message, 'error');
  }

  try {
    const res = await Api.spin.status();
    const d = res.data;
    document.getElementById('freeLeft').textContent = d.free_spins_remaining;
    document.getElementById('spinsLeft').textContent = d.spins_left_today;
    document.getElementById('extraCost').textContent = d.extra_spin_cost > 0 ? Utils.money(d.extra_spin_cost) : 'Free only';
    document.getElementById('usedToday').textContent = d.spins_used_today;
    const btn = document.getElementById('spinBtn');
    const msg = document.getElementById('spinStatusMsg');
    if (!d.spin_enabled) {
      msg.textContent = 'Spin & Win is currently unavailable.'; btn.disabled = true;
    } else if (d.can_spin_free) {
      msg.textContent = 'You have a free spin available!'; btn.disabled = false; btn.textContent = 'Spin for Free';
    } else if (d.can_spin_paid) {
      msg.textContent = `Free spins used. Spin again for ${Utils.money(d.extra_spin_cost)}.`; btn.disabled = false; btn.textContent = `Spin for ${Utils.money(d.extra_spin_cost)}`;
    } else {
      msg.textContent = "You've used all your spins for today. Come back tomorrow!"; btn.disabled = true;
    }
  } catch (err) {
    document.getElementById('spinStatusMsg').textContent = 'Could not load spin status.';
  }
}

async function loadHistory() {
  try {
    const res = await Api.spin.history({ per_page: 20 });
    const rows = res.data.entries || res.data || [];
    const box = document.getElementById('spinHistory');
    box.innerHTML = rows.length ? rows.map(r => `
      <div class="txn-row">
        <div class="txn-row__icon"><span class="material-symbols-outlined">casino</span></div>
        <div class="txn-row__body">
          <div class="txn-row__title" style="text-transform:none;">${Utils.esc(r.label)}</div>
          <div class="txn-row__meta">${Utils.dateFmt(r.created_at)} · ${r.is_free_spin ? 'Free spin' : 'Paid spin'}</div>
        </div>
        <div class="txn-row__amount" style="color:${r.reward_value > 0 ? 'var(--green)' : 'var(--gray-500)'}">
          ${r.reward_value > 0 ? '+' + Utils.money(r.reward_value) : '—'}
        </div>
      </div>`).join('') : `<div class="empty-state small">No spins yet — give it a try!</div>`;
  } catch {
    document.getElementById('spinHistory').innerHTML = `<div class="empty-state small">Could not load spin history.</div>`;
  }
}

function spinToSegment(winningSegmentId) {
  const idx = segments.findIndex(s => s.id === winningSegmentId);
  if (idx === -1) return Promise.resolve();
  const sliceAngle = 360 / segments.length;
  // Land the pointer (fixed at top, 0deg) on the middle of the winning slice.
  const targetAngle = 360 - (idx * sliceAngle + sliceAngle / 2);
  const extraSpins = 360 * 5;
  currentRotation += extraSpins + ((targetAngle - (currentRotation % 360)) + 360) % 360;
  const canvas = document.getElementById('wheelCanvas');
  canvas.style.transform = `rotate(${currentRotation}deg)`;
  return new Promise(resolve => setTimeout(resolve, 4100));
}

async function doSpin() {
  const btn = document.getElementById('spinBtn');
  Utils.setButtonLoading(btn, true, 'Spinning…');
  try {
    const res = await Api.spin.spin();
    const d = res.data;
    await spinToSegment(d.segment_id);

    document.getElementById('winTitle').textContent = d.reward_value > 0 ? 'You won! <span class="material-symbols-outlined">celebration</span>' : 'Better luck next time!';
    let msg = d.label;
    if (d.coupon_code) msg += ` — Coupon code: ${d.coupon_code}`;
    if (d.reward_value > 0 && !d.coupon_code) msg += ` (${Utils.money(d.reward_value)} credited)`;
    document.getElementById('winMessage').textContent = msg;
    Utils.openModal('winModal');

    await loadStatusAndSegments();
    await loadHistory();
  } catch (err) {
    Utils.toast(err.message, 'error');
  } finally {
    Utils.setButtonLoading(btn, false);
  }
}

Auth.guard(async () => {
  document.getElementById('spinBtn').addEventListener('click', doSpin);
  await loadStatusAndSegments();
  await loadHistory();
});
