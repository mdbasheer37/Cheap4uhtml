/**
 * my-profile.js — Account details screen (matches the real app's
 * "My Profile" screen exactly). All displayed fields come from the
 * cached login/register response (User.to_dict() — there is no
 * GET /api/auth/me endpoint).
 *
 * EDIT PROFILE and CHANGE PASSWORD in the real Kivy app (show_edit_profile,
 * save_profile_changes, show_change_password, update_password) are dead
 * local-only code left over from before backend integration — they write
 * to an in-memory `self.users` dict and call `save_users()`, never an
 * actual API call. There is no backend endpoint to update name/email/
 * phone, and no authenticated change-password endpoint (only the OTP-based
 * forgot-password → reset-password flow). Rather than fake a save:
 *   - EDIT PROFILE shows the same 3-field dialog (prefilled) but is honest
 *     that the server doesn't support saving these fields yet.
 *   - CHANGE PASSWORD reuses the real, working password-reset flow: it
 *     triggers POST /api/auth/forgot-password for the current user's own
 *     email (which texts a real OTP) and hands off to reset-password.html
 *     to complete the change with a genuinely verified backend call.
 *
 * PROFIT DASHBOARD is only shown for admin accounts, matching the real
 * app's hardcoded admin-email/role check exactly (also enforced
 * server-side by admin.py's @admin_required, so this is UX only).
 */

const ADMIN_EMAILS = ['admin@cheap4u.com', 'muhammadibrahim3766@gmail.com'];

function renderProfile() {
  const user = Api.getUser();
  if (!user) return;

  document.getElementById('profName').textContent = user.name || 'Guest User';
  document.getElementById('profTier').textContent = user.is_premium ? 'Premium Member' : 'Standard Member';
  document.getElementById('profEmail').textContent = user.email || '—';
  document.getElementById('profPhone').textContent = user.phone || '—';
  document.getElementById('profJoined').textContent = user.joined_date || '—';
  document.getElementById('profLastActive').textContent = user.last_login || '—';

  const verifiedIcon = document.getElementById('verifiedIcon');
  const verifiedLabel = document.getElementById('verifiedLabel');
  if (user.is_verified) {
    verifiedIcon.textContent = 'verified_user';
    verifiedIcon.style.color = 'var(--blue)';
    verifiedLabel.textContent = 'Verified Account';
  } else {
    verifiedIcon.textContent = 'shield_alert';
    verifiedIcon.style.color = 'var(--red)';
    verifiedLabel.textContent = 'Unverified Account';
  }

  if (ADMIN_EMAILS.includes((user.email || '').toLowerCase()) || user.role === 'admin') {
    const btn = document.getElementById('profitDashboardBtn');
    btn.style.display = '';
    btn.addEventListener('click', () => { window.location.href = 'profit.html'; });
  }
}

document.getElementById('editProfileBtn').addEventListener('click', () => {
  const user = Api.getUser();
  document.getElementById('editName').value = user?.name || '';
  document.getElementById('editEmail').value = user?.email || '';
  document.getElementById('editPhone').value = user?.phone || '';
  Utils.openModal('editProfileModal');
});

document.getElementById('saveProfileBtn').addEventListener('click', () => {
  Utils.closeModal('editProfileModal');
  Utils.toast("Profile editing isn't available from the app yet — contact support to update your details.", 'info', 5000);
});

document.getElementById('changePasswordBtn').addEventListener('click', () => {
  document.getElementById('cpNewPassword').value = '';
  document.getElementById('cpConfirmPassword').value = '';
  Utils.openModal('changePasswordModal');
});

document.getElementById('updatePasswordBtn').addEventListener('click', async () => {
  const newPw = document.getElementById('cpNewPassword').value;
  const confirmPw = document.getElementById('cpConfirmPassword').value;
  if (!newPw || !confirmPw) { Utils.toast('Please fill all fields', 'error'); return; }
  if (newPw !== confirmPw) { Utils.toast("New passwords don't match", 'error'); return; }
  if (newPw.length < 6) { Utils.toast('Password must be at least 6 characters', 'error'); return; }

  const user = Api.getUser();
  const btn = document.getElementById('updatePasswordBtn');
  Utils.setButtonLoading(btn, true, 'Sending code…');
  try {
    const res = await Api.auth.forgotPassword({ email: user.email });
    Utils.closeModal('changePasswordModal');
    Utils.toast(res.message || 'OTP sent to your phone', 'success');
    if (res.data && res.data.user_id) {
      window.location.href = `reset-password.html?user_id=${res.data.user_id}&phone=${encodeURIComponent(res.data.phone || '')}`;
    }
  } catch (err) {
    Utils.toast(err.message, 'error');
  } finally {
    Utils.setButtonLoading(btn, false);
  }
});

Auth.requireAuth();
renderProfile();
