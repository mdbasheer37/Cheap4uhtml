/**
 * compare.js — Smart Price Comparison via /api/compare/{data,airtime}.
 * All rankings, prices, and value scores are computed server-side from
 * live plan prices and recent transaction stats — this page only renders
 * what the backend returns.
 */

let activeTab = 'data';

function renderDataComparison(d) {
  const box = document.getElementById('compareContent');
  let html = '';
  if (d.best_value_plan) {
    html += `<div class="gradient-card gradient-card--blue mb-16">
      <div class="small" style="opacity:.85;">🏆 Best Value</div>
      <div style="font-size:18px;font-weight:800;margin-top:4px;">${Utils.esc(d.best_value_plan.provider)} — ${Utils.esc(d.best_value_plan.size)}</div>
      <div class="small mt-8">${Utils.money(d.best_value_plan.price)} · Value score ${d.best_value_plan.value_score}/100</div>
    </div>`;
  }
  if (d.promotions && d.promotions.length) {
    html += `<div class="card mb-16"><div class="card-title">Active Promotions</div>` +
      d.promotions.map(p => `<div class="summary-row"><span>${Utils.esc(p.code)}</span><span>${p.discount_type === 'percentage' ? p.discount_value + '%' : Utils.money(p.discount_value)} off</span></div>`).join('') +
      `</div>`;
  }
  html += `<div class="card"><div class="card-title">All Data Plans (ranked by value)</div>` +
    (d.plans || []).map(p => `
      <div class="plan-item" style="cursor:default;">
        <div>
          <div class="plan-item__name">${Utils.esc(p.provider)} — ${Utils.esc(p.size)}</div>
          <div class="plan-item__sub">${Utils.esc(p.duration)} · ${p.price_per_gb ? '₦' + p.price_per_gb + '/GB' : ''} · Score ${p.value_score}</div>
        </div>
        <div class="plan-item__price">${Utils.money(p.price)}</div>
      </div>`).join('') + `</div>`;
  box.innerHTML = html || `<div class="empty-state">No data plans to compare right now.</div>`;
}

function renderAirtimeComparison(d) {
  const box = document.getElementById('compareContent');
  let html = `<div class="card mb-16"><p class="small text-muted">${Utils.esc(d.note)}</p></div>`;
  if (d.fastest_network || d.most_reliable_network) {
    html += `<div class="stat-row">
      <div class="stat-card"><div class="stat-card__label">Fastest</div><div class="stat-card__value">${Utils.esc(d.fastest_network || '—')}</div></div>
      <div class="stat-card"><div class="stat-card__label">Most Reliable</div><div class="stat-card__value">${Utils.esc(d.most_reliable_network || '—')}</div></div>
    </div>`;
  }
  html += `<div class="card"><div class="card-title">Network Rankings</div>` +
    (d.networks || []).map(n => `
      <div class="summary-row">
        <span>${Utils.esc(n.network)}</span>
        <span>${n.success_rate != null ? n.success_rate + '% success' : 'No data'}${n.avg_processing_time_ms != null ? ' · ' + n.avg_processing_time_ms + 'ms' : ''}</span>
      </div>`).join('') + `</div>`;
  box.innerHTML = html;
}

async function loadComparison() {
  const box = document.getElementById('compareContent');
  box.innerHTML = `<div class="skel" style="height:80px;margin-bottom:10px;"></div>`;
  try {
    if (activeTab === 'data') {
      const res = await Api.compare.data({});
      renderDataComparison(res.data);
    } else {
      const res = await Api.compare.airtime({});
      renderAirtimeComparison(res.data);
    }
  } catch (err) {
    box.innerHTML = `<div class="empty-state">Could not load comparison: ${Utils.esc(err.message)}</div>`;
  }
}

Auth.guard(async () => {
  document.querySelectorAll('[data-tab]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('[data-tab]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeTab = chip.dataset.tab;
      loadComparison();
    });
  });
  await loadComparison();
});
