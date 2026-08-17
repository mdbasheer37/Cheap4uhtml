/**
 * utils.js — Shared helpers used across every page: toasts, formatting,
 * validation, clipboard, button loading-state helpers, modal helpers.
 */

const Utils = (() => {
  // ── Toast notifications ─────────────────────────────────────────────
  function ensureToastContainer() {
    let el = document.getElementById('toast-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast-container';
      el.className = 'toast-container';
      document.body.appendChild(el);
    }
    return el;
  }

  function toast(message, type = 'info', duration = 3800) {
    const container = ensureToastContainer();
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    const icon = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' }[type] || 'ℹ';
    el.innerHTML = `<span class="toast__icon">${icon}</span><span class="toast__msg"></span>`;
    el.querySelector('.toast__msg').textContent = message;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('toast--show'));
    setTimeout(() => {
      el.classList.remove('toast--show');
      setTimeout(() => el.remove(), 250);
    }, duration);
  }

  // ── Formatting ───────────────────────────────────────────────────────
  function money(amount) {
    const n = Number(amount);
    if (Number.isNaN(n)) return '₦0.00';
    return '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function dateFmt(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  }

  function statusBadge(status) {
    const s = (status || '').toLowerCase();
    const cls = s === 'success' ? 'badge--success' : s === 'pending' ? 'badge--pending' : 'badge--failed';
    const label = s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Unknown';
    return `<span class="badge ${cls}">${label}</span>`;
  }

  // ── Validation ───────────────────────────────────────────────────────
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
  }
  function isValidPhone(phone) {
    return /^\d{11}$/.test(phone || '');
  }
  function isValidPin(pin) {
    return /^\d{4,6}$/.test(pin || '');
  }

  // ── Clipboard ────────────────────────────────────────────────────────
  async function copyToClipboard(text, label = 'Copied to clipboard') {
    try {
      await navigator.clipboard.writeText(text);
      toast(label, 'success', 2000);
    } catch {
      // Fallback for older/insecure contexts
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        toast(label, 'success', 2000);
      } catch {
        toast('Could not copy. Please copy manually.', 'error');
      }
      ta.remove();
    }
  }

  // ── Button loading state (double-submit protection) ───────────────────
  function setButtonLoading(btn, loading, loadingText = 'Please wait…') {
    if (!btn) return;
    if (loading) {
      btn.dataset.originalText = btn.dataset.originalText || btn.innerHTML;
      btn.disabled = true;
      btn.classList.add('btn--loading');
      btn.innerHTML = `<span class="spinner"></span> ${loadingText}`;
    } else {
      btn.disabled = false;
      btn.classList.remove('btn--loading');
      if (btn.dataset.originalText) btn.innerHTML = btn.dataset.originalText;
    }
  }

  // ── Modal helpers ────────────────────────────────────────────────────
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.add('modal--open'); document.body.style.overflow = 'hidden'; }
  }
  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('modal--open'); document.body.style.overflow = ''; }
  }

  // ── Query param helper ──────────────────────────────────────────────
  function qparam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  // ── Escape user text before inserting into innerHTML ────────────────
  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str == null ? '' : String(str);
    return d.innerHTML;
  }

  // ── Debounce ─────────────────────────────────────────────────────────
  function debounce(fn, wait = 300) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  return {
    toast, money, dateFmt, statusBadge,
    isValidEmail, isValidPhone, isValidPin,
    copyToClipboard, setButtonLoading, openModal, closeModal,
    qparam, esc, debounce,
  };
})();
