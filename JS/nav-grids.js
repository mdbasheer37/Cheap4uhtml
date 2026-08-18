/**
 * nav-grids.js — Shared Quick Actions + Services grid definitions, used by
 * both dashboard.html and services.html. Matches the real Cheap4u.py app
 * exactly, including which tiles are genuinely wired up vs. still
 * "Coming Soon" placeholders in the real app itself (Transfer to Banks,
 * Transfer to Cheap4U, Smile Voice, Bulk SMS, Betting, Gift Cards) —
 * confirmed directly from Cheap4u.py's show_coming_soon() calls.
 *
 * Each icon carries its own accent `color`, matching the real app's
 * per-icon coloring (every tile icon there is a distinct color, not a
 * single uniform tone) — restored here after the icon-font migration
 * had accidentally dropped it.
 */

const QUICK_ACTIONS = [
  { label: 'Funding', icon: 'credit_card', color: '#2196F3', href: 'wallet.html' },
  { label: 'Transfer to Banks', icon: 'account_balance', color: '#2196F3', comingSoon: true },
  { label: 'Transfer to Cheap4U', icon: 'person', color: '#2196F3', comingSoon: true },
  { label: 'Refer', icon: 'person_add', color: '#8E24AA', href: 'referral.html' },
  { label: 'Cashback', icon: 'undo', color: '#43A047', href: 'cashback.html' },
  { label: 'Spin & Win', icon: 'casino', color: '#FB8C00', href: 'spin.html' },
  { label: 'Coupons', icon: 'sell', color: '#7E57C2', href: 'coupons.html' },
  { label: 'Merchant', icon: 'work', color: '#43A047', href: 'merchant.html' },
  { label: 'Dollar Card', icon: 'credit_card', color: '#5E35B1', href: 'card.html' },
  { label: 'Reminders', icon: 'notifications', color: '#FFA000', href: 'reminders.html' },
  { label: 'Compare', icon: 'bar_chart', color: '#00897B', href: 'compare.html' },
  { label: 'Rewards', icon: 'emoji_events', color: '#FFA000', href: 'rewards.html' },
];

const SERVICES = [
  { label: 'Airtime', icon: 'call', color: '#FF7043', href: 'airtime.html' },
  { label: 'Data', icon: 'wifi', color: '#2196F3', href: 'data.html' },
  { label: 'Smile Voice', icon: 'sentiment_satisfied', color: '#43A047', comingSoon: true },
  { label: 'Electricity', icon: 'bolt', color: '#43A047', href: 'electricity.html' },
  { label: 'Cable Sub', icon: 'tv', color: '#43A047', href: 'cable.html' },
  { label: 'Bulk SMS', icon: 'chat', color: '#FB8C00', comingSoon: true },
  { label: 'Code4Balance', icon: 'code', color: '#E53935', href: 'code4balance.html' },
  { label: 'Exam PIN', icon: 'edit_note', color: '#2196F3', href: 'exampin.html' },
  { label: 'Beneficiary', icon: 'perm_contact_calendar', color: '#FB8C00', href: 'beneficiary.html' },
  { label: 'Pricing', icon: 'payments', color: '#43A047', href: 'pricing.html' },
  { label: 'Upgrade', icon: 'person_add', color: '#FB8C00', href: 'upgrade.html' },
  { label: 'Betting', icon: 'sports_soccer', color: '#43A047', comingSoon: true },
  { label: 'Gift Cards', icon: 'redeem', color: '#EC407A', comingSoon: true },
  { label: 'Airtime to Cash', icon: 'repeat', color: '#FB8C00', href: 'airtime-to-cash.html' },
];

function renderTileGrid(container, items, tileClass = 'grid-tile') {
  container.innerHTML = items.map(item => `
    <div class="${tileClass}" data-href="${item.href || ''}" data-coming-soon="${item.comingSoon ? item.label : ''}">
      <span class="ic" style="color:${item.color};"><span class="material-symbols-outlined">${item.icon}</span></span>
      <span>${item.label}</span>
    </div>`).join('');
  container.querySelectorAll('[data-href], [data-coming-soon]').forEach(el => {
    el.addEventListener('click', () => {
      if (el.dataset.comingSoon) {
        Utils.toast(`${el.dataset.comingSoon} service coming soon!`, 'info');
      } else if (el.dataset.href) {
        window.location.href = el.dataset.href;
      }
    });
  });
}
