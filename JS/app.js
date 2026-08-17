/**
 * app.js — Renders the shared bottom navigation (Home / History / Support /
 * Profile — matches the real app exactly) into any protected page that
 * contains a <div id="bottomNav" data-page="<key>"></div>.
 *
 * Unlike the old sidebar/topbar shell, headers are NOT shared — each page
 * has its own header markup (blob header, simple back-bar, or the
 * dashboard's custom greeting bar) because the real app's screens don't
 * share one header style either.
 */

const NAV_ITEMS = [
  { key: 'dashboard',    label: 'Home',    href: 'dashboard.html',    icon: '🏠' },
  { key: 'transactions', label: 'History', href: 'transactions.html', icon: '🕘' },
  { key: 'support',      label: 'Support', href: 'support.html',      icon: '🎧' },
  { key: 'profile',      label: 'Profile', href: 'profile.html',      icon: '👤' },
];

const Layout = (() => {
  function renderBottomNav() {
    const el = document.getElementById('bottomNav');
    if (!el) return;
    const activeKey = el.dataset.page || '';
    el.innerHTML = NAV_ITEMS.map(item => `
      <a class="bottom-nav__item ${item.key === activeKey ? 'active' : ''}" href="${item.href}">
        <span class="ic">${item.icon}</span>${item.label}
      </a>`).join('');
  }

  return { render: renderBottomNav };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('bottomNav')) {
    if (!Auth.requireAuth()) return;
    Layout.render();
  }
});
