/**
 * reminders.js — Bill Reminders via /api/reminders/* (reminder_routes.py).
 */

const BILL_ICONS = { dstv: '<span class="material-symbols-outlined">tv</span>', gotv: '<span class="material-symbols-outlined">tv</span>', startimes: '<span class="material-symbols-outlined">tv</span>', electricity: '<span class="material-symbols-outlined">bolt</span>', internet: '<span class="material-symbols-outlined">language</span>' };

function reminderRow(r) {
  return `
    <div class="txn-row">
      <div class="txn-row__icon">${BILL_ICONS[r.bill_type] || '<span class="material-symbols-outlined">notifications</span>'}</div>
      <div class="txn-row__body">
        <div class="txn-row__title">${Utils.esc(r.nickname || r.bill_type)}</div>
        <div class="txn-row__meta">${Utils.esc(r.account_identifier)} · Due day ${r.due_day_of_month} · Next: ${Utils.esc(r.next_due_date)}</div>
      </div>
      <button class="btn btn-outline btn-sm" data-delete="${r.id}">Delete</button>
    </div>`;
}

async function loadReminders() {
  const box = document.getElementById('remindersList');
  try {
    const res = await Api.reminders.list();
    const rows = res.data || [];
    box.innerHTML = rows.length ? rows.map(reminderRow).join('') : `<div class="card"><div class="empty-state small">No bill reminders yet — add one so you never miss a payment.</div></div>`;
    box.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this reminder?')) return;
        try {
          await Api.reminders.remove(Number(btn.dataset.delete));
          loadReminders();
        } catch (err) { Utils.toast(err.message, 'error'); }
      });
    });
  } catch (err) {
    box.innerHTML = `<div class="empty-state">Could not load reminders: ${Utils.esc(err.message)}</div>`;
  }
}

document.getElementById('addReminderBtn')?.addEventListener('click', () => {
  document.getElementById('reminderForm').reset();
  Utils.openModal('reminderModal');
});

document.getElementById('reminderForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const bill_type = document.getElementById('billType').value;
  const nickname = document.getElementById('nickname').value.trim();
  const account_identifier = document.getElementById('accountId').value.trim();
  const due_day_of_month = Number(document.getElementById('dueDay').value);
  const estimated_amount = document.getElementById('estAmount').value ? Number(document.getElementById('estAmount').value) : undefined;

  if (!account_identifier || !(due_day_of_month >= 1 && due_day_of_month <= 31)) {
    Utils.toast('Fill in the account number and a valid due day (1–31)', 'error');
    return;
  }

  const btn = document.getElementById('saveReminderBtn');
  Utils.setButtonLoading(btn, true, 'Saving…');
  try {
    const res = await Api.reminders.create({ bill_type, nickname, account_identifier, due_day_of_month, estimated_amount });
    Utils.toast(res.message || 'Reminder created', 'success');
    Utils.closeModal('reminderModal');
    loadReminders();
  } catch (err) {
    Utils.toast(err.message, 'error');
  } finally {
    Utils.setButtonLoading(btn, false);
  }
});

Auth.guard(loadReminders);
