/**
 * auth.js — Page-level authentication guards.
 *
 * Include this on every PROTECTED page (dashboard, services, transactions,
 * etc.) right after api.js + utils.js. It redirects to login.html if there
 * is no stored token. It does not itself verify the token against the
 * backend (the backend does that on every request and 401s are handled
 * centrally in api.js by clearing the session) — but any 401 encountered
 * during the page's own data-loading will bounce the user back to login.
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

  // Wrap a page-init async function: if it throws a 401 ApiError, bounce
  // to login instead of leaving a broken page on screen.
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

// Wire up any logout button present on the page automatically.
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-action="logout"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout();
    });
  });
});
