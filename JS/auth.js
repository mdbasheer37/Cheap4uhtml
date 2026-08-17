/**
 * auth.js — Page-level authentication guards, plus the device-local
 * "Quick PIN" unlock feature that mirrors the real app exactly:
 * after a full email/password login, the app can save a PIN (hashed
 * client-side, never sent anywhere) alongside the session token and
 * user object in local storage. On return visits, entering that PIN
 * re-hydrates the session without re-typing the password — this is a
 * pure device-convenience feature with NO backend endpoint involved,
 * matching Cheap4u.py's attempt_pin_login()/prompt_setup_quick_pin().
 */

const Auth = (() => {
  function requireAuth() {
    if (!Api.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  function redirectIfLoggedIn(destination = 'dashboard.html') {
    if (Api.isLoggedIn()) {
      window.location.href = destination;
    }
  }

  function logout() {
    Api.clearSession();
    window.location.href = 'login.html';
  }

  async function guard(fn) {
    try {
      await fn();
    } catch (err) {
      if (err instanceof Api.ApiError && err.status === 401) {
        Utils.toast('Your session has expired. Please log in again.', 'error');
        setTimeout(() => (window.location.href = 'login.html'), 1200);
      } else {
        throw err;
      }
    }
  }

  return { requireAuth, redirectIfLoggedIn, logout, guard };
})();

const QuickPin = (() => {
  const KEY = 'c4u_quick_pin';

  async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function get() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async function save(email, pin, sessionToken, user) {
    const pin_hash = await sha256(`${pin}:${email.toLowerCase()}`);
    localStorage.setItem(KEY, JSON.stringify({
      email: email.toLowerCase(), pin_hash, session_token: sessionToken, user,
    }));
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  async function verify(pin) {
    const data = get();
    if (!data) return null;
    const hash = await sha256(`${pin}:${data.email}`);
    if (hash === data.pin_hash) return data;
    return null;
  }

  return { get, save, clear, verify };
})();

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-action="logout"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout();
    });
  });
});
