/**
 * exampin.js — Buy Exam PIN page. POST /api/vtpass/exam-pins
 * Body: { exam_type, quantity, selling_price, pin, coupon_code }
 *
 * NOTE: unlike data/cable, the backend has no "list exam pin prices"
 * endpoint — vtunaija.py's buy_exam_pin() requires the frontend to pass
 * `selling_price` explicitly (it is not looked up server-side from a
 * plans table). So this page asks the user for the price per PIN, exactly
 * matching what routes.py's /exam-pins endpoint expects.
 */

const EXAM_LOGOS = {
  WAEC: 'assets/waec.png', NECO: 'assets/neco.png',
  NABTEB: 'assets/nabteb.png', JAMB: 'assets/jamb.png',
};

let selectedExam = null;

function resetForm() {
  document.getElementById('formCard').classList.remove('hidden');
  document.getElementById('resultCard').classList.add('hidden');
}

function renderExamGrid() {
  const grid = document.getElementById('examGrid');
  grid.innerHTML = CONFIG.EXAM_TYPES.map(ex => `
    <div class="provider-item" data-exam="${ex}">
      <img src="${EXAM_LOGOS[ex]}" alt="${ex}" onerror="this.style.display='none'">
      <span>${ex}</span>
    </div>`).join('');
  grid.querySelectorAll('.provider-item').forEach(el => {
    el.addEventListener('click', () => {
      grid.querySelectorAll('.provider-item').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
      selectedExam = el.dataset.exam;
    });
  });
}

function updateTotalPreview() {
  const qty = Number(document.getElementById('quantity').value) || 0;
  const price = Number(document.getElementById('price').value) || 0;
  document.getElementById('totalPreview').textContent = Utils.money(qty * price);
}

async function submitExam(e) {
  e.preventDefault();
  const quantity = Number(document.getElementById('quantity').value);
  const pricePerPin = Number(document.getElementById('price').value);
  const coupon_code = document.getElementById('coupon').value.trim();

  let valid = true;
  if (!selectedExam) { Utils.toast('Please select an exam type', 'error'); valid = false; }
  if (!(quantity >= 1 && quantity <= 10)) { Utils.toast('Quantity must be between 1 and 10', 'error'); valid = false; }
  document.getElementById('f-price').classList.toggle('has-error', !(pricePerPin > 0));
  if (!(pricePerPin > 0)) valid = false;
  if (!valid) return;

  const selling_price = Math.round(quantity * pricePerPin * 100) / 100;

  const pin = await Purchase.requestPin();
  if (!pin) return;

  const btn = document.getElementById('submitBtn');
  Utils.setButtonLoading(btn, true, 'Processing…');
  try {
    const res = await Api.vtu.examPin({ exam_type: selectedExam, quantity, selling_price, pin, coupon_code });
    const d = res.data || {};
    document.getElementById('formCard').classList.add('hidden');
    const resultCard = document.getElementById('resultCard');
    resultCard.classList.remove('hidden');
    Purchase.renderSuccess(resultCard, {
      title: `${selectedExam} PIN Purchase Successful`,
      message: `${quantity} ${selectedExam} PIN(s) purchased.`,
      rows: [
        { label: 'PIN', value: d.pin || 'N/A', copy: !!d.pin },
        { label: 'Serial', value: d.serial || 'N/A', copy: !!d.serial },
        { label: 'Reference', value: d.reference || '—', copy: true },
        { label: 'New Wallet Balance', value: Utils.money(d.new_balance) },
      ],
    });
  } catch (err) {
    document.getElementById('formCard').classList.add('hidden');
    const resultCard = document.getElementById('resultCard');
    resultCard.classList.remove('hidden');
    Purchase.renderError(resultCard, err.message, resetForm);
  } finally {
    Utils.setButtonLoading(btn, false);
  }
}

Auth.guard(async () => {
  renderExamGrid();
  document.getElementById('quantity').addEventListener('input', updateTotalPreview);
  document.getElementById('price').addEventListener('input', updateTotalPreview);
  document.getElementById('examForm').addEventListener('submit', submitExam);
});
