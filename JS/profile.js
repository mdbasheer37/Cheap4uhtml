/**
 * profile.js — Profile & Settings.
 *
 * User fields come from the cached login/register response (User.to_dict
 * in models.py) — there is no GET /api/auth/me endpoint in the backend,
 * so the cached copy from login/register/OTP-verify is the freshest data
 * available without re-authenticating.
 *
 * PIN set/change uses POST /api/auth/set-pin { old_pin, new_pin }.
 *
 * Privacy Policy / Terms of Service / Delete Account are server-rendered
 * HTML pages hosted directly by the Flask backend (public_pages.py) —
 * not JSON endpoints — so they are linked out to directly rather than
 * fetched and re-rendered.
 */

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

function renderProfile() {
  const user = Api.getUser();
  if (!user) return;
  document.getElementById('bigAvatar').textContent = initials(user.name);
  document.getElementById('profName').textContent = user.name || '—';
  document.getElementById('profEmail').textContent = user.email || '—';
  document.getElementById('profPhone').textContent = user.phone || '—';
  document.getElementById('profRefCode').textContent = user.referral_code || '—';
  document.getElementById('profJoined').textContent = user.joined_date || '—';
  document.getElementById('profLastLogin').textContent = user.last_login || '—';
  document.getElementById('verifiedBadge').style.display = user.is_verified ? '' : 'none';
  document.getElementById('premiumBadge').style.display = user.is_premium ? '' : 'none';

  document.getElementById('privacyLink').href = CONFIG.API_BASE_URL + '/privacy-policy';
  document.getElementById('termsLink').href = CONFIG.API_BASE_URL + '/terms-of-service';
  document.getElementById('deleteAccountLink').href = CONFIG.API_BASE_URL + '/delete-account';
}

async function submitPin(e) {
  e.preventDefault();
  const old_pin = document.getElementById('oldPin').value.trim();
  const new_pin = document.getElementById('newPin').value.trim();

  const valid = Utils.isValidPin(new_pin);
  document.getElementById('f-newpin').classList.toggle('has-error', !valid);
  if (!valid) return;

  const btn = document.getElementById('pinBtn');
  Utils.setButtonLoading(btn, true, 'Saving…');
  try {
    const res = await Api.auth.setPin({ old_pin: old_pin || undefined, new_pin });
    Utils.toast(res.message || 'PIN saved', 'success');
    document.getElementById('pinForm').reset();
  } catch (err) {
    Utils.toast(err.message, 'error');
  } finally {
    Utils.setButtonLoading(btn, false);
  }
}

Auth.guard(async () => {
  renderProfile();
  document.getElementById('pinForm').addEventListener('submit', submitPin);
});
