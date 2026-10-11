/**
 * DRIVE LEGAL AI — POLICE OFFICER COMMAND CONTROLLER (POLICE.JS)
 * Smart India Hackathon 2026
 */

let selectedViolationForReview = null;
let configuredFineRules = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth(['POLICE', 'ADMIN'])) return;
  Utils.initNavigation();

  await loadPoliceMetrics();
  await loadFineRules();
  await loadViolationsTable();

  // Search filter listeners
  const statusFilter = document.getElementById('police-status-filter');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => loadViolationsTable());
  }

  const searchInput = document.getElementById('police-violation-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => loadViolationsTable());
  }

  // Bind Advanced Commuter Search Form
  const userSearchForm = document.getElementById('officer-user-search-form');
  if (userSearchForm) {
    userSearchForm.addEventListener('submit', handleOfficerUserSearch);
  }
});

/**
 * Load Police command KPI counters
 */
async function loadPoliceMetrics() {
  const res = await API.get('/analytics/dashboard');
  if (res.success && res.data) {
    const v = res.data.violations;
    const f = res.data.finances;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal('police-total-violations', v.total);
    setVal('police-pending-review', v.pendingReview);
    setVal('police-approved-violations', v.approved);
    setVal('police-rejected-violations', v.rejected);

    setVal('police-pending-fines', Utils.formatCurrency(f.pendingCollection));
    setVal('police-paid-fines', Utils.formatCurrency(f.totalCollected));
    setVal('police-overdue-fines', Utils.formatCurrency(f.overdueCollection));
  }
}

/**
 * Fetch configured fine rules for approval dropdown
 */
async function loadFineRules() {
  const res = await API.get('/fines/rules');
  if (res.success && res.data) {
    configuredFineRules = res.data;
  }
}

/**
 * Load violations into police table
 */
async function loadViolationsTable() {
  const status = document.getElementById('police-status-filter')?.value || '';
  const search = document.getElementById('police-violation-search')?.value || '';

  const params = {};
  if (status) params.reviewStatus = status;
  if (search) params.vehicleNumber = search;

  const res = await API.get('/violations', params);
  const tbody = document.getElementById('police-violations-tbody');
  if (!tbody) return;

  if (!res.success || !res.data || res.data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No violations match the specified filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = res.data
    .map((vio) => {
      let statusBadge = `<span class="badge bg-warning text-dark">PENDING REVIEW</span>`;
      if (vio.reviewStatus === 'APPROVED') statusBadge = `<span class="badge bg-success">APPROVED</span>`;
      else if (vio.reviewStatus === 'REJECTED') statusBadge = `<span class="badge bg-danger">REJECTED</span>`;
      else if (vio.reviewStatus === 'NEEDS_REVIEW') statusBadge = `<span class="badge bg-info">NEEDS REVIEW</span>`;

      return `
      <tr>
        <td><span class="fw-bold text-cyan">${vio.violationId}</span></td>
        <td><span class="badge bg-dark border border-secondary">${vio.vehicleNumber}</span></td>
        <td>${vio.violationType}</td>
        <td>
          <div class="d-flex align-items-center gap-1">
            <span class="fw-bold text-cyan">${vio.aiConfidence}%</span>
            <small class="text-muted">(AI Model)</small>
          </div>
        </td>
        <td>${Utils.formatDateTime(vio.createdAt)}</td>
        <td>${statusBadge}</td>
        <td>
          <button class="btn-dl btn-dl-outline" style="padding: 0.3rem 0.75rem; font-size: 0.75rem;" onclick="openReviewModal('${vio._id}')">
            <i class="bi bi-eye"></i> Review
          </button>
        </td>
      </tr>
    `;
    })
    .join('');
}

/**
 * Open Evidence & Officer Review Modal
 */
window.openReviewModal = async function (id) {
  const res = await API.get(`/violations/${id}`);
  if (!res.success || !res.data) {
    Utils.showToast('danger', 'Error', 'Could not load violation candidate.');
    return;
  }

  selectedViolationForReview = res.data;
  const vio = res.data;

  // Populate Modal Fields
  document.getElementById('modal-vio-id').textContent = vio.violationId;
  document.getElementById('modal-vio-plate').textContent = vio.vehicleNumber;
  document.getElementById('modal-vio-type').textContent = vio.violationType;
  document.getElementById('modal-vio-location').textContent = vio.location;
  document.getElementById('modal-vio-confidence').textContent = `${vio.aiConfidence}%`;
  document.getElementById('modal-vio-source').textContent = vio.detectionSource;

  const notesEl = document.getElementById('modal-officer-notes');
  if (notesEl) notesEl.value = vio.officerNotes || '';

  // Populate Fine Rule Selector
  const ruleSelect = document.getElementById('modal-fine-rule-select');
  if (ruleSelect) {
    ruleSelect.innerHTML = configuredFineRules
      .map(
        (r) =>
          `<option value="${r._id}" ${r.violationType === vio.violationType ? 'selected' : ''}>
            ${r.violationType} — Base: ₹${r.baseFine} (Due: ${r.duePeriodDays} days)
          </option>`
      )
      .join('');
  }

  // Open Bootstrap Modal
  const modalEl = document.getElementById('violationReviewModal');
  if (modalEl && typeof bootstrap !== 'undefined') {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
};

/**
 * Officer Approves Candidate
 */
window.handleApproveCandidate = async function () {
  if (!selectedViolationForReview) return;
  const ruleId = document.getElementById('modal-fine-rule-select')?.value;
  const notes = document.getElementById('modal-officer-notes')?.value;

  const res = await API.post(`/violations/${selectedViolationForReview._id}/approve`, {
    fineRuleId: ruleId,
    officerNotes: notes,
  });

  if (res.success) {
    Utils.showToast('success', 'Candidate Approved', 'Official fine ticket generated and commuter notified.');
    closeModal();
    await loadPoliceMetrics();
    await loadViolationsTable();
  } else {
    Utils.showToast('danger', 'Approval Failed', res.message);
  }
};

/**
 * Officer Rejects Candidate
 */
window.handleRejectCandidate = async function () {
  if (!selectedViolationForReview) return;
  const notes = document.getElementById('modal-officer-notes')?.value;

  const res = await API.post(`/violations/${selectedViolationForReview._id}/reject`, {
    officerNotes: notes,
  });

  if (res.success) {
    Utils.showToast('info', 'Candidate Rejected', 'Violation candidate dismissed. No legal fine generated.');
    closeModal();
    await loadPoliceMetrics();
    await loadViolationsTable();
  } else {
    Utils.showToast('danger', 'Error', res.message);
  }
};

function closeModal() {
  const modalEl = document.getElementById('violationReviewModal');
  if (modalEl && typeof bootstrap !== 'undefined') {
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
  }
}

/**
 * Advanced Commuter Search with Legal Audit
 */
async function handleOfficerUserSearch(e) {
  e.preventDefault();
  const form = e.target;
  const query = {
    vehicleNumber: form.vehicleNumber?.value || '',
    phone: form.phone?.value || '',
    name: form.name?.value || '',
  };

  const res = await API.get('/users/search', query);
  const resultsContainer = document.getElementById('officer-search-results');
  if (!resultsContainer) return;

  if (!res.success || !res.data || res.data.length === 0) {
    resultsContainer.innerHTML = `<div class="p-3 text-muted text-center">No commuter records found matching query. Query recorded in official audit log.</div>`;
    return;
  }

  resultsContainer.innerHTML = res.data
    .map(
      (u) => `
    <div class="glass-card mb-2 p-3">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h6 class="mb-1 text-white">${u.name}</h6>
          <small class="text-muted"><i class="bi bi-envelope"></i> ${u.email} | <i class="bi bi-telephone"></i> ${u.phone || 'N/A'}</small>
        </div>
        <div class="text-end">
          <span class="badge bg-info">Safety Score: ${u.driverScore}/100</span>
          <div class="text-dim small mt-1">Audit Recorded</div>
        </div>
      </div>
    </div>
  `
    )
    .join('');

  Utils.showToast('info', 'Search Audited', `Search completed for ${res.resultCount} records. Action logged to audit trail.`);
}
