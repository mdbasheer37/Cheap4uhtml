/**
 * rewards.js — Rewards (XP levels, missions, badges, leaderboard) via
 * /api/gamification/* (gamification_routes.py). XP, level, and mission
 * progress are all computed and awarded server-side on real purchases.
 */

async function loadRewards() {
  const box = document.getElementById('rewardsContent');
  try {
    const [summaryRes, missionsRes, badgesRes, leaderboardRes] = await Promise.allSettled([
      Api.gamification.summary(),
      Api.gamification.missions(),
      Api.gamification.myBadges(),
      Api.gamification.leaderboard({ limit: 10 }),
    ]);

    let html = '';

    if (summaryRes.status === 'fulfilled') {
      const d = summaryRes.value.data;
      const lvl = d.current_level;
      const next = d.next_level;
      const pct = next ? Math.min(100, Math.round(((next.xp_required - d.xp_to_next_level) / next.xp_required) * 100)) : 100;
      html += `<div class="gradient-card gradient-card--purple mb-16">
        <div class="flex" style="justify-content:space-between;align-items:center;">
          <div>
            <div class="small" style="opacity:.85;">${lvl ? lvl.icon + ' ' : ''}Level ${lvl ? lvl.level_number : '—'}</div>
            <div style="font-size:20px;font-weight:800;margin-top:2px;">${Utils.esc(lvl ? lvl.title : 'Newcomer')}</div>
          </div>
          <div style="text-align:right;">
            <div class="small" style="opacity:.85;">Rank</div>
            <div style="font-size:20px;font-weight:800;">#${d.rank}</div>
          </div>
        </div>
        <div class="small mt-16" style="opacity:.9;">${d.total_xp} XP${next ? ` · ${d.xp_to_next_level} XP to ${Utils.esc(next.title)}` : ' · Max level'}</div>
        <div style="background:rgba(255,255,255,.25);border-radius:8px;height:8px;margin-top:8px;overflow:hidden;">
          <div style="background:#fff;height:100%;width:${pct}%;"></div>
        </div>
      </div>`;
    }

    html += `<div class="section-title" style="padding-left:0;">Missions</div>`;
    if (missionsRes.status === 'fulfilled' && missionsRes.value.data.length) {
      html += `<div class="card mb-16">` + missionsRes.value.data.map(m => `
        <div class="summary-row" style="align-items:flex-start;">
          <span style="flex:1;">
            <b style="color:var(--gray-900);">${Utils.esc(m.title)}</b><br>
            <span class="small">${Utils.esc(m.description || '')} · ${Utils.esc(m.period)}</span>
          </span>
          <span>${m.is_completed ? '✅' : `${m.progress_value}/${m.target_value}`}</span>
        </div>`).join('') + `</div>`;
    } else {
      html += `<div class="card mb-16"><div class="empty-state small">No active missions right now.</div></div>`;
    }

    html += `<div class="section-title" style="padding-left:0;">My Badges</div>`;
    if (badgesRes.status === 'fulfilled' && badgesRes.value.data.length) {
      html += `<div class="grid-4" style="padding:0;margin-bottom:16px;">` + badgesRes.value.data.map(b => `
        <div class="grid-tile grid-tile--service" title="${Utils.esc(b.description || '')}">
          <span class="ic">${Utils.esc(b.icon || '🏅')}</span>
          <span>${Utils.esc(b.name)}</span>
        </div>`).join('') + `</div>`;
    } else {
      html += `<div class="card mb-16"><div class="empty-state small">No badges earned yet — keep purchasing to unlock some!</div></div>`;
    }

    html += `<div class="section-title" style="padding-left:0;">XP Leaderboard</div>`;
    if (leaderboardRes.status === 'fulfilled' && leaderboardRes.value.data.length) {
      html += `<div class="card">` + leaderboardRes.value.data.map(u => `
        <div class="txn-row">
          <div class="txn-row__icon">${u.rank <= 3 ? ['🥇','🥈','🥉'][u.rank - 1] : `#${u.rank}`}</div>
          <div class="txn-row__body">
            <div class="txn-row__title" style="text-transform:none;">${Utils.esc(u.name)}</div>
            <div class="txn-row__meta">Level ${u.level}</div>
          </div>
          <div class="txn-row__amount">${u.total_xp} XP</div>
        </div>`).join('') + `</div>`;
    } else {
      html += `<div class="card"><div class="empty-state small">No leaderboard data yet.</div></div>`;
    }

    box.innerHTML = html;
  } catch (err) {
    box.innerHTML = `<div class="empty-state">Could not load rewards: ${Utils.esc(err.message)}</div>`;
  }
}

Auth.guard(loadRewards);
