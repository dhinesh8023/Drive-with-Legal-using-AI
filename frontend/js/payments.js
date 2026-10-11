/**
 * DRIVE LEGAL AI — PAYMENTS CONTROLLER (PAYMENTS.JS)
 * Smart India Hackathon 2026
 */

let activeFineForPayment = null;
let selectedPaymentMethod = 'UPI';

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth()) return;
  Utils.initNavigation();

  // Check URL parameters for direct fineId
  const params = new URLSearchParams(window.location.search);
  const fineId = params.get('fineId');

  if (fineId) {
    await loadFineDetailsForCheckout(fineId);
  } else {
    await loadUnpaidFinesSelector();
  }

  bindPaymentMethodTabs();

  const payBtn = document.getElementById('initiate-checkout-btn');
  if (payBtn) {
    payBtn.addEventListener('click', handlePaymentExecution);
  }
});

async function loadFineDetailsForCheckout(fineId) {
  const res = await API.get(`/fines/${fineId}`);
  if (res.success && res.data) {
    activeFineForPayment = res.data;
    renderCheckoutSummary(activeFineForPayment);
  } else {
    Utils.showToast('danger', 'Error', 'Fine ticket not found');
  }
}

async function loadUnpaidFinesSelector() {
  const res = await API.get('/fines', { status: 'PENDING' });
  const selectEl = document.getElementById('checkout-fine-selector');
  if (!selectEl) return;

  if (res.success && res.data && res.data.length > 0) {
    selectEl.innerHTML = res.data
      .map((f) => `<option value="${f._id}">${f.fineId} — ${f.violationType} (₹${f.fineAmount})</option>`)
      .join('');

    activeFineForPayment = res.data[0];
    renderCheckoutSummary(activeFineForPayment);

    selectEl.addEventListener('change', async (e) => {
      await loadFineDetailsForCheckout(e.target.value);
    });
  } else {
    selectEl.innerHTML = '<option>No unpaid fines pending</option>';
    document.getElementById('checkout-card')?.classList.add('d-none');
    document.getElementById('no-fines-card')?.classList.remove('d-none');
  }
}

function renderCheckoutSummary(fine) {
  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setEl('checkout-fine-id', fine.fineId);
  setEl('checkout-violation-type', fine.violationType);
  setEl('checkout-plate', fine.vehicleNumber);
  setEl('checkout-due-date', Utils.formatDate(fine.dueDate));
  setEl('checkout-amount-display', Utils.formatCurrency(fine.fineAmount));
  setEl('checkout-final-total', Utils.formatCurrency(fine.fineAmount));
}

function bindPaymentMethodTabs() {
  document.querySelectorAll('.payment-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.payment-tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPaymentMethod = btn.dataset.method;

      // Toggle UI hints
      const fastagNotice = document.getElementById('fastag-method-notice');
      if (fastagNotice) {
        if (selectedPaymentMethod === 'FASTag') {
          fastagNotice.classList.remove('d-none');
        } else {
          fastagNotice.classList.add('d-none');
        }
      }
    });
  });
}

/**
 * Complete Payment Simulation & Backend Verification
 */
async function handlePaymentExecution() {
  if (!activeFineForPayment) return;

  const btn = document.getElementById('initiate-checkout-btn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Processing ${selectedPaymentMethod} Clearance...`;
  }

  // 1. Initiate backend session
  const initRes = await API.post('/payments/create', {
    fineId: activeFineForPayment._id,
    paymentMethod: selectedPaymentMethod,
  });

  if (!initRes.success) {
    Utils.showToast('danger', 'Payment Session Error', initRes.message);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `Complete Payment via ${selectedPaymentMethod}`;
    }
    return;
  }

  // 2. Complete backend verification
  setTimeout(async () => {
    const verifyRes = await API.post('/payments/verify', {
      transactionReference: initRes.data.transactionReference,
      paymentId: initRes.data.paymentId,
    });

    if (verifyRes.success && verifyRes.data) {
      Utils.showToast('success', 'Payment Settled', `Challan cleared! Reference: ${initRes.data.transactionReference}`);
      showPaymentSuccessModal(verifyRes.data);
    } else {
      Utils.showToast('danger', 'Verification Rejected', verifyRes.message);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `Retry Payment`;
      }
    }
  }, 1200);
}

function showPaymentSuccessModal(paymentData) {
  document.getElementById('success-modal-fine-id').textContent = paymentData.fineId;
  document.getElementById('success-modal-amount').textContent = Utils.formatCurrency(paymentData.amount);
  document.getElementById('success-modal-receipt-link').href = `${CONFIG.API_BASE_URL}/payments/receipt/${paymentData.fineId}`;

  const modalEl = document.getElementById('paymentSuccessModal');
  if (modalEl && typeof bootstrap !== 'undefined') {
    new bootstrap.Modal(modalEl).show();
  }
}
