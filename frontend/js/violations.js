/**
 * DRIVE LEGAL AI — VIOLATIONS DIRECTORY (VIOLATIONS.JS)
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth()) return;
  Utils.initNavigation();

  await loadViolations();

  const filter = document.getElementById('violation-type-filter');
  if (filter) filter.addEventListener('change', () => loadViolations());
});

async function loadViolations() {
  const type = document.getElementById('violation-type-filter')?.value || '';
  const params = {};
  if (type) params.violationType = type;

  const res = await API.get('/violations', params);
  const tbody = document.getElementById('violations-table-tbody');
  if (!tbody) return;

  if (!res.success || !res.data || res.data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No violations found in the registry.</td></tr>`;
    return;
  }

  tbody.innerHTML = res.data
    .map(
      (v) => `
    <tr>
      <td><span class="fw-bold text-cyan">${v.violationId}</span></td>
      <td><span class="badge bg-dark border border-secondary">${v.vehicleNumber}</span></td>
      <td>${v.violationType}</td>
      <td>${v.location}</td>
      <td>
        <span class="fw-bold text-white">${v.aiConfidence}%</span>
        <small class="text-muted">(AI Assisted)</small>
      </td>
      <td>
        <span class="badge bg-${v.reviewStatus === 'APPROVED' ? 'success' : v.reviewStatus === 'REJECTED' ? 'danger' : 'warning'}">
          ${v.reviewStatus}
        </span>
      </td>
      <td>${Utils.formatDateTime(v.createdAt)}</td>
    </tr>
  `
    )
    .join('');
}
