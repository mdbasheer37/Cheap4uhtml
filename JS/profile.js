/**
 * profile.js — Profile menu. Set-PIN calls the real backend
 * (POST /api/auth/set-pin). Themes and notification toggle are genuine
 * device-local features in the real app too (no backend field for
 * either) — replicated here via localStorage. Security/Legal are static
 * info, and Account Deletion / Privacy / Terms link to the backend's own
 * server-rendered pages (public_pages.py), matching the original.
 */

function applyTheme() {
  const dark = localStorage.getItem('c4u_theme') === 'dark';
  document.documentElement.classList.toggle('theme-dark', dark);
}
applyTheme();

document.getElementById('themesItem')?.addEventListener('click', () => {
  const current = localStorage.getItem('c4u_theme') === 'dark' ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('c4u_theme', next);
  applyTheme();
  Utils.toast(`Switched to ${next} theme`, 'success');
});

document.getElementById('settingsItem')?.addEventListener('click', () => {
  document.getElementById('notifToggle').checked = localStorage.getItem('c4u_notifications') !== 'off';
  Utils.openModal('settingsModal');
});

window.saveLocalSettings = function () {
  const enabled = document.getElementById('notifToggle').checked;
  localStorage.setItem('c4u_notifications', enabled ? 'on' : 'off');
  Utils.closeModal('settingsModal');
  Utils.toast('Settings saved!', 'success');
};

document.getElementById('securityItem')?.addEventListener('click', () => {
  alert('Security Options:\n\n• Set Transaction PIN — Profile <span class="material-symbols-outlined">arrow_forward</span> Set Transaction PIN\n• Change Password — Login screen <span class="material-symbols-outlined">arrow_forward</span> Forgot Password\n• Always logout after use\n• Never share your PIN or password');
});

document.getElementById('legalItem')?.addEventListener('click', () => {
  if (confirm('View Privacy Policy? (Cancel to view Terms of Service instead)')) {
    window.open(CONFIG.API_BASE_URL + '/privacy-policy', '_blank');
  } else {
    window.open(CONFIG.API_BASE_URL + '/terms-of-service', '_blank');
  }
});

document.getElementById('deleteAccountItem')?.addEventListener('click', () => {
  window.open(CONFIG.API_BASE_URL + '/delete-account', '_blank');
});

document.getElementById('setPinItem')?.addEventListener('click', () => {
  document.getElementById('pinForm').reset();
  Utils.openModal('pinModal');
});

document.getElementById('pinForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const old_pin = document.getElementById('oldPin').value.trim();
  const new_pin = document.getElementById('newPin').value.trim();
  if (!Utils.isValidPin(new_pin)) { Utils.toast('New PIN must be 4–6 digits', 'error'); return; }

  const btn = document.getElementById('pinBtn');
  Utils.setButtonLoading(btn, true, 'Saving…');
  try {
    const res = await Api.auth.setPin({ old_pin: old_pin || undefined, new_pin });
    Utils.toast(res.message || 'PIN saved', 'success');
    Utils.closeModal('pinModal');
  } catch (err) {
    Utils.toast(err.message, 'error');
  } finally {
    Utils.setButtonLoading(btn, false);
  }
});

Auth.requireAuth();
