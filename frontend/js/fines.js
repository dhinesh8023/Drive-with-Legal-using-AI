/**
 * DRIVE LEGAL AI — FINE MANAGEMENT & DISPUTE HANDLER (FINES.JS)
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth()) return;
  Utils.initNavigation();

  await loadFinesTable();

  const statusFilter = document.getElementById('fine-status-filter');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => loadFinesTable());
  }

  // Dispute submission form
  const disputeForm = document.getElementById('dispute-submit-form');
  if (disputeForm) {
    disputeForm.addEventListener('submit', handleDisputeSubmit);
  }
});

async function loadFinesTable() {
  const status = document.getElementById('fine-status-filter')?.value || '';
  const params = {};
  if (status) params.status = status;

  const res = await API.get('/fines', params);
  const tbody = document.getElementById('fines-table-tbody');
  if (!tbody) return;

  if (!res.success || !res.data || res.data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No fine records found.</td></tr>`;
    return;
  }

  const user = Auth.getUser();
  const isOfficer = user.role === 'POLICE' || user.role === 'ADMIN';

  tbody.innerHTML = res.data
    .map((fine) => {
      let statusBadge = `<span class="badge bg-warning text-dark">PENDING</span>`;
      if (fine.status === 'PAID') statusBadge = `<span class="badge bg-success">PAID</span>`;
      else if (fine.status === 'OVERDUE') statusBadge = `<span class="badge bg-danger">OVERDUE</span>`;
      else if (fine.status === 'DISPUTED') statusBadge = `<span class="badge bg-info">DISPUTED</span>`;
      else if (fine.status === 'CANCELLED') statusBadge = `<span class="badge bg-secondary">CANCELLED</span>`;

      return `
      <tr>
        <td><span class="fw-bold text-cyan">${fine.fineId}</span></td>
        <td>${fine.violationType}</td>
        <td><span class="badge bg-dark border border-secondary">${fine.vehicleNumber}</span></td>
        <td class="fw-bold text-white">${Utils.formatCurrency(fine.fineAmount)}</td>
        <td>${Utils.formatDate(fine.dueDate)}</td>
        <td>${statusBadge}</td>
        <td>
          <div class="d-flex align-items-center gap-1">
            ${
              fine.status === 'PENDING' || fine.status === 'OVERDUE'
                ? `<a href="payments.html?fineId=${fine._id}" class="btn-dl btn-dl-primary" style="padding: 0.25rem 0.65rem; font-size: 0.75rem;">Pay</a>`
                : ''
            }
            ${
              fine.status === 'PAID'
                ? `<a href="${CONFIG.API_BASE_URL}/payments/receipt/${fine._id}" target="_blank" class="btn-dl btn-dl-outline" style="padding: 0.25rem 0.65rem; font-size: 0.75rem;"><i class="bi bi-file-earmark-pdf"></i> Receipt</a>`
                : ''
            }
            ${
              fine.status === 'PENDING' && !isOfficer
                ? `<button class="btn-dl btn-dl-secondary" style="padding: 0.25rem 0.65rem; font-size: 0.75rem;" onclick="openDisputeModal('${fine._id}', '${fine.fineId}')">Dispute</button>`
                : ''
            }
            ${
              isOfficer && fine.status !== 'PAID'
                ? `<button class="btn-dl btn-dl-outline" style="padding: 0.25rem 0.65rem; font-size: 0.75rem;" onclick="triggerReminderEscalation('${fine._id}')"><i class="bi bi-bell"></i> Remind</button>`
                : ''
            }
          </div>
        </td>
      </tr>
    `;
    })
    .join('');
}

window.openDisputeModal = function (fineId, displayId) {
  document.getElementById('dispute-target-fine-id').value = fineId;
  document.getElementById('dispute-modal-label').textContent = `Dispute Fine ${displayId}`;

  const modalEl = document.getElementById('disputeModal');
  if (modalEl && typeof bootstrap !== 'undefined') {
    new bootstrap.Modal(modalEl).show();
  }
};

async function handleDisputeSubmit(e) {
  e.preventDefault();
  const fineId = document.getElementById('dispute-target-fine-id').value;
  const reason = document.getElementById('dispute-reason-select').value;
  const description = document.getElementById('dispute-description-input').value;

  const res = await API.post('/disputes', {
    fineId,
    reason,
    description,
  });

  if (res.success) {
    Utils.showToast('success', 'Dispute Submitted', 'Fine is on judicial hold pending officer review.');
    const modalEl = document.getElementById('disputeModal');
    if (modalEl && typeof bootstrap !== 'undefined') {
      bootstrap.Modal.getInstance(modalEl)?.hide();
    }
    await loadFinesTable();
  } else {
    Utils.showToast('danger', 'Submission Failed', res.message);
  }
}

window.triggerReminderEscalation = async function (fineId) {
  const res = await API.post(`/fines/${fineId}/remind`, {});
  if (res.success) {
    Utils.showToast('info', 'Escalation Sent', `Reminder (Level ${res.data.reminderLevel}) dispatched via ${res.data.channel}`);
    await loadFinesTable();
  } else {
    Utils.showToast('danger', 'Reminder Error', res.message);
  }
};
