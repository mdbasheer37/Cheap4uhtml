/**
 * purchase.js — Shared helpers for every purchase page (airtime, data,
 * electricity, cable, exam pin): a transaction-PIN confirmation modal,
 * and success/error result rendering. Backend remains the source of
 * truth for every purchase result — this file only presents it.
 */

const Purchase = (() => {
  function injectPinModal() {
    if (document.getElementById('pinModal')) return;
    const el = document.createElement('div');
    el.id = 'pinModal';
    el.className = 'modal-backdrop';
    el.innerHTML = `
      <div class="modal-sheet">
        <div class="modal-header">
          <div class="modal-title">Enter Transaction PIN</div>
          <button class="modal-close" type="button" id="pinModalClose"><span class="material-symbols-outlined">close</span></button>
        </div>
        <p class="small text-muted mb-16">Enter your 4–6 digit PIN to authorize this transaction.</p>
        <div class="field">
          <input class="input" type="password" id="pinModalInput" inputmode="numeric" maxlength="6" placeholder="••••" autocomplete="off">
          <div class="field-error" id="pinModalError">Incorrect PIN. Try again.</div>
        </div>
        <button class="btn btn-primary btn-block" id="pinModalConfirm">Confirm</button>
        <p class="small text-center mt-16"><a href="profile.html" style="color:var(--blue-600);font-weight:700;">No PIN set? Set one here</a></p>
      </div>`;
    document.body.appendChild(el);
    document.getElementById('pinModalClose').addEventListener('click', () => Utils.closeModal('pinModal'));
  }

  /** Returns a Promise<string|null> — resolves with the PIN, or null if cancelled. */
  function requestPin() {
    injectPinModal();
    return new Promise((resolve) => {
      const input = document.getElementById('pinModalInput');
      const confirmBtn = document.getElementById('pinModalConfirm');
      const closeBtn = document.getElementById('pinModalClose');
      input.value = '';
      document.getElementById('pinModalError').style.display = 'none';
      Utils.openModal('pinModal');
      setTimeout(() => input.focus(), 150);

      const cleanup = () => {
        confirmBtn.onclick = null;
        closeBtn.onclick = null;
        input.onkeydown = null;
      };
      const onConfirm = () => {
        const pin = input.value.trim();
        if (!Utils.isValidPin(pin)) {
          document.getElementById('pinModalError').style.display = 'block';
          return;
        }
        Utils.closeModal('pinModal');
        cleanup();
        resolve(pin);
      };
      confirmBtn.onclick = onConfirm;
      input.onkeydown = (e) => { if (e.key === 'Enter') onConfirm(); };
      closeBtn.onclick = () => { Utils.closeModal('pinModal'); cleanup(); resolve(null); };
    });
  }

  function renderSuccess(container, { title, message, rows = [] }) {
    container.innerHTML = `
      <div class="result-box">
        <div class="result-box__icon result-box__icon--success"><span class="material-symbols-outlined">check</span></div>
        <h3>${Utils.esc(title)}</h3>
        <p>${Utils.esc(message)}</p>
        ${rows.map(r => `
          <div class="copyable-row">
            <span><b>${Utils.esc(r.label)}:</b> ${Utils.esc(r.value)}</span>
            ${r.copy ? `<button data-copy="${Utils.esc(r.value)}">Copy</button>` : ''}
          </div>`).join('')}
        <div class="flex gap-12 mt-24">
          <a href="dashboard.html" class="btn btn-outline btn-block">Dashboard</a>
          <a href="transactions.html" class="btn btn-primary btn-block">View Receipt</a>
        </div>
      </div>`;
    container.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', () => Utils.copyToClipboard(btn.dataset.copy, 'Copied'));
    });
  }

  function renderError(container, message, retryFn) {
    container.innerHTML = `
      <div class="result-box">
        <div class="result-box__icon result-box__icon--error"><span class="material-symbols-outlined">close</span></div>
        <h3>Transaction Failed</h3>
        <p>${Utils.esc(message)}</p>
        <button class="btn btn-primary mt-24" id="purchaseRetryBtn">Try Again</button>
      </div>`;
    document.getElementById('purchaseRetryBtn').addEventListener('click', retryFn);
  }

  return { requestPin, renderSuccess, renderError };
})();
