/**
 * nav-grids.js — Shared Quick Actions + Services grid definitions, used by
 * both dashboard.html and services.html. Matches the real Cheap4u.py app
 * exactly, including which tiles are genuinely wired up vs. still
 * "Coming Soon" placeholders in the real app itself (Transfer to Banks,
 * Transfer to Cheap4U, Smile Voice, Bulk SMS, Betting, Gift Cards) —
 * confirmed directly from Cheap4u.py's show_coming_soon() calls.
 */

const QUICK_ACTIONS = [
  { label: 'Funding', icon: '💳', href: 'wallet.html' },
  { label: 'Transfer to Banks', icon: '🏦', comingSoon: true },
  { label: 'Transfer to Cheap4U', icon: '👤', comingSoon: true },
  { label: 'Refer', icon: '➕', href: 'referral.html' },
  { label: 'Cashback', icon: '🔙', href: 'cashback.html' },
  { label: 'Spin & Win', icon: '🎡', href: 'spin.html' },
  { label: 'Coupons', icon: '🏷️', href: 'coupons.html' },
  { label: 'Merchant', icon: '💼', href: 'merchant.html' },
  { label: 'Dollar Card', icon: '💳', href: 'card.html' },
  { label: 'Reminders', icon: '🔔', href: 'reminders.html' },
  { label: 'Compare', icon: '📊', href: 'compare.html' },
  { label: 'Rewards', icon: '🏆', href: 'rewards.html' },
];

const SERVICES = [
  { label: 'Airtime', icon: '📞', href: 'airtime.html' },
  { label: 'Data', icon: '📶', href: 'data.html' },
  { label: 'Smile Voice', icon: '🙂', comingSoon: true },
  { label: 'Electricity', icon: '⚡', href: 'electricity.html' },
  { label: 'Cable Sub', icon: '📺', href: 'cable.html' },
  { label: 'Bulk SMS', icon: '💬', comingSoon: true },
  { label: 'Code4Balance', icon: '</>', href: 'code4balance.html' },
  { label: 'Exam PIN', icon: '📝', href: 'exampin.html' },
  { label: 'Beneficiary', icon: '👤', href: 'beneficiary.html' },
  { label: 'Pricing', icon: '💵', href: 'pricing.html' },
  { label: 'Upgrade', icon: '⬆️', href: 'upgrade.html' },
  { label: 'Betting', icon: '⚽', comingSoon: true },
  { label: 'Gift Cards', icon: '🎁', comingSoon: true },
  { label: 'Airtime to Cash', icon: '🔁', href: 'airtime-to-cash.html' },
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
