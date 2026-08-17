/**
 * api.js — Centralized API client for the Cheap4U Flask backend.
 *
 * Every network call in this app goes through request(). It:
 *   - Prefixes CONFIG.API_BASE_URL
 *   - Attaches "Authorization: Bearer <token>" automatically when a token
 *     is stored (unless skipAuth is passed)
 *   - Parses JSON responses defensively (never throws on missing fields)
 *   - Normalizes errors into a single ApiError shape
 *   - Detects expired/invalid JWTs (401) and clears local auth state
 *
 * No backend route is invented here — every path below was read directly
 * from the Flask source (auth.py, routes.py, plans.py, payment.py,
 * referral.py, cashback_routes.py, challenge_routes.py, coupon_routes.py,
 * spin_routes.py, ai_chat.py).
 */

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

const Api = (() => {
  function getToken() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
  }

  function setSession(token, user) {
    if (token) localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
    if (user) localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
  }

  function getUser() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function isLoggedIn() {
    return !!getToken();
  }

  /**
   * Core request function. All GET/POST/PUT/DELETE helpers below call this.
   * @param {string} path - e.g. '/api/auth/login'
   * @param {object} opts - { method, body, params, skipAuth, isFormData }
   */
  async function request(path, opts = {}) {
    const { method = 'GET', body, params, skipAuth = false } = opts;

    let url = CONFIG.API_BASE_URL + path;
    if (params && Object.keys(params).length) {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
      ).toString();
      if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    }

    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token && !skipAuth) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (networkErr) {
      throw new ApiError(
        'Network error — check your internet connection and try again.',
        0,
        null
      );
    }

    let data = null;
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        // Non-JSON response (e.g. an HTML error page from a proxy/host)
        data = null;
      }
    }

    if (!response.ok) {
      // 401 = expired/invalid JWT on a protected route. Clear local auth
      // state so the next page load redirects to login instead of looping
      // on stale credentials.
      if (response.status === 401 && !skipAuth) {
        clearSession();
      }
      const message = friendlyErrorMessage(response.status, data);
      throw new ApiError(message, response.status, data);
    }

    return data;
  }

  function friendlyErrorMessage(status, data) {
    const backendMsg = data && (data.message || data.error);
    if (backendMsg) return backendMsg;
    switch (status) {
      case 400: return 'That request was invalid. Please check the details and try again.';
      case 401: return 'Your session has expired. Please log in again.';
      case 403: return "You don't have permission to do that.";
      case 404: return 'That resource could not be found.';
      case 409: return 'This action conflicts with existing data. Please refresh and try again.';
      case 422: return 'Some of the information provided is invalid.';
      case 429: return 'Too many requests. Please wait a moment and try again.';
      case 500: return 'Something went wrong on our end. Please try again shortly.';
      case 0: return 'Network error — check your internet connection and try again.';
      default: return 'An unexpected error occurred. Please try again.';
    }
  }

  const get = (path, params, opts = {}) => request(path, { method: 'GET', params, ...opts });
  const post = (path, body, opts = {}) => request(path, { method: 'POST', body, ...opts });
  const put = (path, body, opts = {}) => request(path, { method: 'PUT', body, ...opts });
  const del = (path, body, opts = {}) => request(path, { method: 'DELETE', body, ...opts });

  return {
    getToken, setSession, clearSession, getUser, isLoggedIn,
    get, post, put, del,
    ApiError,

    // ── AUTH (auth.py) ────────────────────────────────────────────────
    auth: {
      register: (data) => post('/api/auth/register', data, { skipAuth: true }),
      verifyOtp: (data) => post('/api/auth/verify-otp', data, { skipAuth: true }),
      resendOtp: (data) => post('/api/auth/resend-otp', data, { skipAuth: true }),
      login: (data) => post('/api/auth/login', data, { skipAuth: true }),
      setPin: (data) => post('/api/auth/set-pin', data),
      verifyPin: (data) => post('/api/auth/verify-pin', data),
      forgotPassword: (data) => post('/api/auth/forgot-password', data, { skipAuth: true }),
      resetPassword: (data) => post('/api/auth/reset-password', data, { skipAuth: true }),
    },

    // ── PLANS (plans.py) — public, no auth required ─────────────────────
    plans: {
      data: () => get('/api/plans/data', null, { skipAuth: true }),
      cable: () => get('/api/plans/cable', null, { skipAuth: true }),
      electricityProviders: () => get('/api/plans/electricity-providers', null, { skipAuth: true }),
    },

    // ── VTU PURCHASES (routes.py) ────────────────────────────────────
    vtu: {
      airtime: (data) => post('/api/vtpass/airtime', data),
      data: (data) => post('/api/vtpass/data', data),
      electricity: (data) => post('/api/vtpass/electricity', data),
      cableTv: (data) => post('/api/vtpass/cable-tv', data),
      examPin: (data) => post('/api/vtpass/exam-pins', data),
      transactions: (params) => get('/api/vtpass/transactions', params),
    },

    // ── AIRTIME TO CASH (routes.py) ──────────────────────────────────
    airtimeToCash: {
      generateOtp: (data) => post('/api/airtime-to-cash/generate-otp', data),
      verifyOtp: (data) => post('/api/airtime-to-cash/verify-otp', data),
      checkQuota: (data) => post('/api/airtime-to-cash/check-quota', data),
      transfer: (data) => post('/api/airtime-to-cash/transfer', data),
    },

    // ── PAYMENT / WALLET (payment.py) ────────────────────────────────
    payment: {
      initialize: (data) => post('/api/payment/initialize', data),
      verify: (reference) => get(`/api/payment/verify/${encodeURIComponent(reference)}`),
      accountDetails: () => get('/api/payment/account-details'),
      transactions: (params) => get('/api/payment/transactions', params),
    },

    // ── REFERRAL (referral.py) ───────────────────────────────────────
    referral: {
      info: () => get('/api/referral/info'),
      stats: () => get('/api/referral/stats'),
      history: () => get('/api/referral/history'),
      referredUsers: () => get('/api/referral/referred-users'),
      useBonus: (data) => post('/api/referral/use-bonus', data),
    },

    // ── CASHBACK (cashback_routes.py) ────────────────────────────────
    cashback: {
      wallet: () => get('/api/cashback/wallet'),
      rates: () => get('/api/cashback/rates'),
      history: (params) => get('/api/cashback/history', params),
      redeem: (data) => post('/api/cashback/redeem', data),
    },

    // ── MONTHLY CHALLENGE (challenge_routes.py) ──────────────────────
    challenge: {
      leaderboard: (params) => get('/api/challenge/leaderboard', params),
      mySummary: () => get('/api/challenge/my-summary'),
      winners: (params) => get('/api/challenge/winners', params),
      notifications: (params) => get('/api/challenge/notifications', params),
      markNotificationsRead: (data) => post('/api/challenge/notifications/read', data),
    },

    // ── SPIN & WIN (spin_routes.py) ───────────────────────────────────
    spin: {
      status: () => get('/api/spin/status'),
      segments: () => get('/api/spin/segments'),
      spin: () => post('/api/spin/spin'),
      history: (params) => get('/api/spin/history', params),
      coupons: () => get('/api/spin/coupons'),
    },

    // ── COUPONS (coupon_routes.py) ────────────────────────────────────
    coupons: {
      validate: (params) => get('/api/coupons/validate', params),
      myCoupons: () => get('/api/coupons/my-coupons'),
    },

    // ── AI SUPPORT CHAT (ai_chat.py) ──────────────────────────────────
    chat: {
      send: (data) => post('/api/chat', data),
      history: () => get('/api/chat/history'),
      clearHistory: () => del('/api/chat/history'),
      feedback: (data) => post('/api/chat/feedback', data),
      contactInfo: () => get('/api/chat/contact-info', null, { skipAuth: true }),
    },

    // ── DOLLAR CARD (card_routes.py, prefix /api/cards) ───────────────
    cards: {
      config: () => get('/api/cards/config'),
      list: () => get('/api/cards'),
      create: (data) => post('/api/cards', data),
      get: (cardId) => get(`/api/cards/${cardId}`),
      fund: (cardId, data) => post(`/api/cards/${cardId}/fund`, data),
      freeze: (cardId) => post(`/api/cards/${cardId}/freeze`, {}),
      unfreeze: (cardId) => post(`/api/cards/${cardId}/unfreeze`, {}),
      remove: (cardId) => del(`/api/cards/${cardId}`),
      history: (cardId, params) => get(`/api/cards/${cardId}/transactions`, params),
    },

    // ── PRICE COMPARISON (comparison_routes.py, prefix /api/compare) ──
    compare: {
      data: (params) => get('/api/compare/data', params),
      airtime: (params) => get('/api/compare/airtime', params),
    },

    // ── REWARDS / GAMIFICATION (gamification_routes.py, prefix /api/gamification) ──
    gamification: {
      summary: () => get('/api/gamification/summary'),
      levels: () => get('/api/gamification/levels'),
      missions: () => get('/api/gamification/missions'),
      myBadges: () => get('/api/gamification/badges'),
      allBadges: () => get('/api/gamification/badges/all'),
      leaderboard: (params) => get('/api/gamification/leaderboard', params),
    },

    // ── MERCHANT (merchant_routes.py, prefix /api/merchant) ───────────
    merchant: {
      apply: (data) => post('/api/merchant/apply', data),
      profile: () => get('/api/merchant/profile'),
      wallet: () => get('/api/merchant/wallet'),
      bulkAirtime: (data) => post('/api/merchant/bulk/airtime', data),
      bulkData: (data) => post('/api/merchant/bulk/data', data),
      bulkElectricity: (data) => post('/api/merchant/bulk/electricity', data),
      bulkCableTv: (data) => post('/api/merchant/bulk/cable-tv', data),
      bulkExamPin: (data) => post('/api/merchant/bulk/exam-pin', data),
      bulkJobs: (params) => get('/api/merchant/bulk/jobs', params),
      bulkJobDetail: (jobId) => get(`/api/merchant/bulk/jobs/${jobId}`),
      profitAnalytics: (params) => get('/api/merchant/analytics/profit', params),
      transactionReport: (params) => get('/api/merchant/reports/transactions', params),
      regenerateApiKey: () => post('/api/merchant/api-key/regenerate', {}),
    },

    // ── BILL REMINDERS (reminder_routes.py, prefix /api/reminders) ────
    reminders: {
      list: () => get('/api/reminders'),
      create: (data) => post('/api/reminders', data),
      update: (id, data) => put(`/api/reminders/${id}`, data),
      remove: (id) => del(`/api/reminders/${id}`),
      history: (params) => get('/api/reminders/history', params),
    },
  };
})();
