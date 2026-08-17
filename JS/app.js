/**
 * app.js — Renders the shared app shell (sidebar / topbar / bottom nav)
 * into any protected page that contains a <div id="appShell"></div> with
 * a data-page="<key>" attribute marking the active nav item, and a
 * <main id="pageContent"></main> for the page's own markup.
 */

const NAV_ITEMS = [
  { key: 'dashboard',    label: 'Dashboard',    href: 'dashboard.html',    icon: '🏠', bottom: true  },
  { key: 'services',     label: 'Services',     href: 'services.html',     icon: '⚡', bottom: true  },
  { key: 'transactions', label: 'Transactions', href: 'transactions.html', icon: '📜', bottom: true  },
  { key: 'referral',     label: 'Referral',     href: 'referral.html',     icon: '🤝', bottom: false },
  { key: 'cashback',     label: 'Cashback',     href: 'cashback.html',     icon: '💰', bottom: false },
  { key: 'challenge',    label: 'Challenge',    href: 'challenge.html',    icon: '🏆', bottom: false },
  { key: 'spin',         label: 'Spin & Win',   href: 'spin.html',         icon: '🎡', bottom: false },
  { key: 'coupons',      label: 'Coupons',      href: 'coupons.html',      icon: '🎟️', bottom: false },
  { key: 'a2c',          label: 'Airtime to Cash', href: 'airtime-to-cash.html', icon: '🔄', bottom: false },
  { key: 'support',      label: 'Support',      href: 'support.html',      icon: '💬', bottom: true  },
  { key: 'profile',      label: 'Profile',      href: 'profile.html',      icon: '👤', bottom: false },
];

const PAGE_TITLES = {
  dashboard: 'Dashboard', services: 'Services', transactions: 'Transactions',
  referral: 'Referral Program', cashback: 'Cashback', challenge: 'Monthly Challenge',
  spin: 'Spin & Win', coupons: 'Coupons', a2c: 'Airtime to Cash', support: 'Support Center',
  profile: 'Profile & Settings', wallet: 'Fund Wallet',
  airtime: 'Buy Airtime', data: 'Buy Data', electricity: 'Pay Electricity Bill',
  cable: 'Cable TV Subscription', exampin: 'Buy Exam PIN',
};

const Layout = (() => {
  function initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
  }

  function render() {
    const shell = document.getElementById('appShell');
    if (!shell) return;
    const activeKey = shell.dataset.page || '';
    const user = Api.getUser();
    const title = PAGE_TITLES[activeKey] || CONFIG.APP_NAME;

    const sidebarLinks = NAV_ITEMS.map(item => `
      <a class="sidebar__link ${item.key === activeKey ? 'active' : ''}" href="${item.href}">
        <span class="ic">${item.icon}</span>${item.label}
      </a>`).join('');

    const bottomLinks = NAV_ITEMS.filter(i => i.bottom).map(item => `
      <a class="bottom-nav__item ${item.key === activeKey ? 'active' : ''}" href="${item.href}">
        <span class="ic">${item.icon}</span>${item.label}
      </a>`).join('') + `
      <a class="bottom-nav__item ${activeKey === 'profile' ? 'active' : ''}" href="profile.html">
        <span class="ic">👤</span>More
      </a>`;

    shell.innerHTML = `
      <aside class="sidebar">
        <div class="sidebar__brand">
          <img src="assets/logo.png" alt="Cheap4U Technology" onerror="this.style.display='none'">
          <span>CHEAP4U<br>TECHNOLOGY</span>
        </div>
        <nav class="sidebar__nav">${sidebarLinks}</nav>
        <div class="sidebar__footer">
          <a class="sidebar__link" data-action="logout" href="#"><span class="ic">🚪</span>Logout</a>
        </div>
      </aside>
      <header class="topbar">
        <div class="topbar__title">${title}</div>
        <div class="topbar__right">
          <a href="profile.html" class="avatar" title="${Utils.esc(user?.name || '')}">${initials(user?.name)}</a>
        </div>
      </header>
      <nav class="bottom-nav">${bottomLinks}</nav>
    `;
  }

  return { render };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('appShell')) {
    if (!Auth.requireAuth()) return;
    Layout.render();
  }
});
