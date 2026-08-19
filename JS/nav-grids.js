/**
 * nav-grids.js — Shared Quick Actions + Services grid definitions, used by
 * both dashboard.html and services.html. Matches the real Cheap4u.py app
 * exactly, including which tiles are genuinely wired up vs. still
 * "Coming Soon" placeholders in the real app itself (Transfer to Banks,
 * Transfer to Cheap4U, Smile Voice, Bulk SMS, Betting, Gift Cards) —
 * confirmed directly from Cheap4u.py's show_coming_soon() calls.
 *
 * Every color below is converted directly from the exact RGBA floats in
 * Cheap4u.py's KV `text_color: [r, g, b, 1]` lines for each icon — not
 * eyeballed from a screenshot. Icon names are the closest Material
 * Symbols Outlined equivalent to the source's MDI icon name (noted per
 * item where the glyph isn't a 1:1 match).
 */

const QUICK_ACTIONS = [
  { label: 'Funding', icon: 'credit_card', color: '#1A99FF', href: 'wallet.html' },                 // MDI credit-card
  { label: 'Transfer to Banks', icon: 'account_balance', color: '#1A80E6', comingSoon: true },       // MDI bank-transfer
  { label: 'Transfer to Cheap4U', icon: 'send', color: '#1A99FF', comingSoon: true },                // MDI account-arrow-right
  { label: 'Refer', icon: 'person_add', color: '#9933CC', href: 'referral.html' },                   // MDI account-plus
  { label: 'Cashback', icon: 'currency_exchange', color: '#1ABF59', href: 'cashback.html' },         // MDI cash-refund
  { label: 'Spin & Win', icon: 'casino', color: '#F28C1A', href: 'spin.html' },                      // MDI dharmachakra
  { label: 'Coupons', icon: 'sell', color: '#594CE6', href: 'coupons.html' },                        // MDI ticket-percent
  { label: 'Merchant', icon: 'work', color: '#1A8C66', href: 'merchant.html' },                      // MDI briefcase-outline
  { label: 'Dollar Card', icon: 'credit_card', color: '#4C40B2', href: 'card.html' },                // MDI credit-card-outline
  { label: 'Reminders', icon: 'notifications', color: '#BF8C1A', href: 'reminders.html' },           // MDI bell-ring-outline
  { label: 'Compare', icon: 'bar_chart', color: '#1A99A6', href: 'compare.html' },                   // MDI chart-bar
  { label: 'Rewards', icon: 'emoji_events', color: '#D9991A', href: 'rewards.html' },                // MDI trophy-outline
];

const SERVICES = [
  { label: 'Airtime', icon: 'call', color: '#FF6633', href: 'airtime.html' },                        // MDI phone
  { label: 'Data', icon: 'wifi', color: '#1A99FF', href: 'data.html' },                              // MDI wifi
  { label: 'Smile Voice', icon: 'sentiment_satisfied', color: '#33CC33', comingSoon: true },         // MDI emoticon-outline
  { label: 'Electricity', icon: 'bolt', color: '#1ACC1A', href: 'electricity.html' },                // MDI flash
  { label: 'Cable Sub', icon: 'tv', color: '#009900', href: 'cable.html' },                          // MDI television
  { label: 'Bulk SMS', icon: 'chat', color: '#FF991A', comingSoon: true },                           // MDI message-text
  { label: 'Code4Balance', icon: 'code', color: '#FF0000', href: 'code4balance.html' },              // MDI code-tags
  { label: 'Exam PIN', icon: 'edit_note', color: '#1A99FF', href: 'exampin.html' },                  // MDI file-document-edit
  { label: 'Beneficiary', icon: 'contacts', color: '#FF991A', href: 'beneficiary.html' },            // MDI account-box-multiple
  { label: 'Pricing', icon: 'payments', color: '#33CC33', href: 'pricing.html' },                    // MDI cash
  { label: 'Upgrade', icon: 'upgrade', color: '#CC661A', href: 'upgrade.html' },                     // MDI account-arrow-up
  { label: 'Betting', icon: 'sports_soccer', color: '#33B24C', comingSoon: true },                   // MDI soccer
  { label: 'Gift Cards', icon: 'redeem', color: '#E64C80', comingSoon: true },                       // MDI gift
  { label: 'Airtime to Cash', icon: 'currency_exchange', color: '#E6801A', href: 'airtime-to-cash.html' }, // MDI cash-refund (source reuses the Cashback icon here too)
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
