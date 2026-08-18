/**
 * admin-users.js — View & Manage Users via /api/admin/users (+ block/
 * unblock). Matches the real app's _display_admin_users fields: name,
 * email, wallet balance, active status.
 */

let allUsers = [];

function checkAdmin() {
  const user = Api.getUser();
  const ADMIN_EMAILS = ['admin@cheap4u.com', 'muhammadibrahim3766@gmail.com'];
  if (!user || (!ADMIN_EMAILS.includes((user.email || '').toLowerCase()) && user.role !== 'admin')) {
    alert('Admin access required');
    window.location.href = 'dashboard.html';
    return false;
  }
  return true;
}

function renderUsers(filter = '') {
  const box = document.getElementById('usersList');
  const f = filter.toLowerCase();
  const filtered = allUsers.filter(u => (u.name || '').toLowerCase().includes(f) || (u.email || '').toLowerCase().includes(f));
  box.innerHTML = filtered.length ? filtered.map(u => `
    <div class="card mb-16">
      <div class="flex" style="justify-content:space-between;">
        <div>
          <div style="font-weight:800;">${Utils.esc(u.name || '?')}</div>
          <div class="text-muted small">${Utils.esc(u.email)}</div>
        </div>
        ${Utils.statusBadge(u.is_active ? 'success' : 'failed').replace('Success', 'Active').replace('Failed', 'Blocked')}
      </div>
      <div class="flex mt-8" style="justify-content:space-between;align-items:center;">
        <div style="font-weight:800;">${Utils.money(u.wallet_balance)}</div>
        <button class="btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-secondary'}" data-id="${u.id}" data-active="${u.is_active}">
          ${u.is_active ? 'Block' : 'Unblock'}
        </button>
      </div>
    </div>`).join('') : `<div class="empty-state">No users found</div>`;

  box.querySelectorAll('[data-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.id);
      const isActive = btn.dataset.active === 'true';
      Utils.setButtonLoading(btn, true, '');
      try {
        const res = isActive ? await Api.admin.blockUser(id) : await Api.admin.unblockUser(id);
        Utils.toast(res.message, 'success');
        await loadUsers();
      } catch (err) {
        Utils.toast(err.message, 'error');
        Utils.setButtonLoading(btn, false);
      }
    });
  });
}

async function loadUsers() {
  try {
    const res = await Api.admin.users();
    allUsers = res.data || [];
    renderUsers(document.getElementById('userSearch').value);
  } catch (err) {
    document.getElementById('usersList').innerHTML = `<div class="empty-state">Could not load users: ${Utils.esc(err.message)}</div>`;
  }
}

document.getElementById('userSearch').addEventListener('input', Utils.debounce((e) => renderUsers(e.target.value), 200));

Auth.guard(async () => {
  if (!checkAdmin()) return;
  await loadUsers();
});
