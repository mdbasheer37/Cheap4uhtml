/**
 * nav-grids.js — Shared Quick Actions + Services grid definitions, used by
 * both dashboard.html and services.html. Matches the real Cheap4u.py app
 * exactly, including which tiles are genuinely wired up vs. still
 * "Coming Soon" placeholders in the real app itself (Transfer to Banks,
 * Transfer to Cheap4U, Smile Voice, Bulk SMS, Betting, Gift Cards) —
 * confirmed directly from Cheap4u.py's show_coming_soon() calls.
 */

const QUICK_ACTIONS = [
  { label: 'Funding', icon: '<span class="material-symbols-outlined">credit_card</span>', href: 'wallet.html' },
  { label: 'Transfer to Banks', icon: '<span class="material-symbols-outlined">account_balance</span>', comingSoon: true },
  { label: 'Transfer to Cheap4U', icon: '<span class="material-symbols-outlined">person</span>', comingSoon: true },
  { label: 'Refer', icon: '<span class="material-symbols-outlined">add</span>', href: 'referral.html' },
  { label: 'Cashback', icon: '<span class="material-symbols-outlined">undo</span>', href: 'cashback.html' },
  { label: 'Spin & Win', icon: '<span class="material-symbols-outlined">casino</span>', href: 'spin.html' },
  { label: 'Coupons', icon: '<span class="material-symbols-outlined">sell</span>', href: 'coupons.html' },
  { label: 'Merchant', icon: '<span class="material-symbols-outlined">work</span>', href: 'merchant.html' },
  { label: 'Dollar Card', icon: '<span class="material-symbols-outlined">credit_card</span>', href: 'card.html' },
  { label: 'Reminders', icon: '<span class="material-symbols-outlined">notifications</span>', href: 'reminders.html' },
  { label: 'Compare', icon: '<span class="material-symbols-outlined">bar_chart</span>', href: 'compare.html' },
  { label: 'Rewards', icon: '<span class="material-symbols-outlined">emoji_events</span>', href: 'rewards.html' },
];

const SERVICES = [
  { label: 'Airtime', icon: '<span class="material-symbols-outlined">call</span>', href: 'airtime.html' },
  { label: 'Data', icon: '<span class="material-symbols-outlined">wifi</span>', href: 'data.html' },
  { label: 'Smile Voice', icon: '<span class="material-symbols-outlined">sentiment_satisfied</span>', comingSoon: true },
  { label: 'Electricity', icon: '<span class="material-symbols-outlined">bolt</span>', href: 'electricity.html' },
  { label: 'Cable Sub', icon: '<span class="material-symbols-outlined">tv</span>', href: 'cable.html' },
  { label: 'Bulk SMS', icon: '<span class="material-symbols-outlined">chat</span>', comingSoon: true },
  { label: 'Code4Balance', icon: '</>', href: 'code4balance.html' },
  { label: 'Exam PIN', icon: '<span class="material-symbols-outlined">edit_note</span>', href: 'exampin.html' },
  { label: 'Beneficiary', icon: '<span class="material-symbols-outlined">person</span>', href: 'beneficiary.html' },
  { label: 'Pricing', icon: '<span class="material-symbols-outlined">payments</span>', href: 'pricing.html' },
  { label: 'Upgrade', icon: '<span class="material-symbols-outlined">arrow_upward</span>', href: 'upgrade.html' },
  { label: 'Betting', icon: '<span class="material-symbols-outlined">sports_soccer</span>', comingSoon: true },
  { label: 'Gift Cards', icon: '<span class="material-symbols-outlined">redeem</span>', comingSoon: true },
  { label: 'Airtime to Cash', icon: '<span class="material-symbols-outlined">repeat</span>', href: 'airtime-to-cash.html' },
];

function renderTileGrid(container, items, tileClass = 'grid-tile') {
  container.innerHTML = items.map(item => `
    <div class="${tileClass}" data-href="${item.href || ''}" data-coming-soon="${item.comingSoon ? item.label : ''}">
      <span class="ic">${item.icon}</span>
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
