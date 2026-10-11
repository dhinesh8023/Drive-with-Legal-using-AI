/**
 * DRIVE LEGAL AI — FASTAG WALLET & TOLL LEDGER (FASTAG.JS)
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth()) return;
  Utils.initNavigation();

  await loadFastagAccount();

  // Quick recharge buttons
  document.querySelectorAll('.recharge-pill-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const input = document.getElementById('recharge-amount-input');
      if (input) input.value = e.target.dataset.amount;
    });
  });

  const form = document.getElementById('fastag-recharge-form');
  if (form) {
    form.addEventListener('submit', handleFastagRecharge);
  }
});

async function loadFastagAccount() {
  const res = await API.get('/fastag');
  if (res.success && res.data) {
    const acc = res.data;

    document.getElementById('fastag-tag-id').textContent = acc.fastagId;
    document.getElementById('fastag-vehicle-plate').textContent = acc.vehicleNumber;
    document.getElementById('fastag-bank-name').textContent = acc.issuingBank;
    document.getElementById('fastag-wallet-balance').textContent = Utils.formatCurrency(acc.currentBalance);

    const statusEl = document.getElementById('fastag-account-status');
    if (statusEl) {
      statusEl.className = `badge bg-${acc.status === 'ACTIVE' ? 'success' : 'warning'}`;
      statusEl.textContent = acc.status;
    }

    renderFastagTransactions(acc.transactions || []);
  }
}

function renderFastagTransactions(txns) {
  const tbody = document.getElementById('fastag-transactions-tbody');
  if (!tbody) return;

  if (txns.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No recent toll or clearance debits logged.</td></tr>`;
    return;
  }

  tbody.innerHTML = txns
    .map((t) => {
      const isCredit = t.type === 'WALLET_RECHARGE';
      return `
      <tr>
        <td><span class="fw-bold text-cyan">${t.transactionId}</span></td>
        <td>${t.plazaName || 'Clearing Hub'}</td>
        <td>${Utils.formatDateTime(t.timestamp)}</td>
        <td class="fw-bold ${isCredit ? 'text-success' : 'text-danger'}">
          ${isCredit ? '+' : '-'}${Utils.formatCurrency(t.amount)}
        </td>
        <td class="text-white">${Utils.formatCurrency(t.balanceAfter)}</td>
      </tr>
    `;
    })
    .join('');
}

async function handleFastagRecharge(e) {
  e.preventDefault();
  const amount = document.getElementById('recharge-amount-input').value;

  const res = await API.post('/fastag/recharge', { amount: Number(amount) });
  if (res.success) {
    Utils.showToast('success', 'Wallet Recharged', `FASTag balance credited with ₹${amount}`);
    await loadFastagAccount();
  } else {
    Utils.showToast('danger', 'Recharge Failed', res.message);
  }
}
