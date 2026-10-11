/**
 * DRIVE LEGAL AI — GOVERNMENT & CIVIC ANALYTICS CONTROLLER (GOVERNMENT.JS)
 * Smart India Hackathon 2026
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth(['GOVERNMENT_STAFF', 'ADMIN'])) return;
  Utils.initNavigation();

  await loadGovernmentMetrics();
  initGovernmentCharts();
  await loadBlackspotsCivicTable();
});

async function loadGovernmentMetrics() {
  const res = await API.get('/analytics/dashboard');
  if (res.success && res.data) {
    const v = res.data.violations;
    const f = res.data.finances;
    const r = res.data.roadSafety;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal('gov-total-violations', v.total);
    setVal('gov-fines-generated', f.totalFinesCount);
    setVal('gov-total-collection', Utils.formatCurrency(f.totalCollected));
    setVal('gov-pending-collection', Utils.formatCurrency(f.pendingCollection));
    setVal('gov-overdue-collection', Utils.formatCurrency(f.overdueCollection));
    setVal('gov-blackspots-count', r.highRiskBlackspots);
    setVal('gov-hazards-count', r.activeHazards);
    setVal('gov-near-misses-count', r.recordedNearMisses);
  }
}

function initGovernmentCharts() {
  if (typeof Chart === 'undefined') return;

  // 1. Violations by District Chart (Bar Chart)
  const distCtx = document.getElementById('districtViolationsChart');
  if (distCtx) {
    new Chart(distCtx, {
      type: 'bar',
      data: {
        labels: ['Chennai Central', 'Bengaluru South', 'Coimbatore Urban', 'Madurai Ring', 'Salem Expressway'],
        datasets: [
          {
            label: 'Recorded Violations',
            data: [42, 38, 24, 18, 12],
            backgroundColor: 'rgba(0, 240, 255, 0.65)',
            borderColor: '#00f0ff',
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94a3b8' } } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
        },
      },
    });
  }

  // 2. Fine Collection vs Pending Trend (Line Chart)
  const finCtx = document.getElementById('fineCollectionTrendChart');
  if (finCtx) {
    new Chart(finCtx, {
      type: 'line',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
          {
            label: 'Collection Realized (₹)',
            data: [45000, 68000, 92000, 124000],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            fill: true,
            tension: 0.35,
          },
          {
            label: 'Pending Fines (₹)',
            data: [32000, 28000, 24000, 19000],
            borderColor: '#f59e0b',
            borderDash: [5, 5],
            fill: false,
            tension: 0.35,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94a3b8' } } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
        },
      },
    });
  }

  // 3. Near-Miss and Crash Avoidance Distribution (Doughnut)
  const nmCtx = document.getElementById('nearMissBreakdownChart');
  if (nmCtx) {
    new Chart(nmCtx, {
      type: 'doughnut',
      data: {
        labels: ['Emergency Braking', 'Near Collision', 'Blind Overtaking', 'Lane Departure', 'Jaywalking Risk'],
        datasets: [
          {
            data: [35, 25, 15, 15, 10],
            backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#00f0ff', '#8b5cf6'],
            borderColor: '#0a0d14',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 12 } } },
      },
    });
  }
}

async function loadBlackspotsCivicTable() {
  const res = await API.get('/analytics/blackspots');
  const tbody = document.getElementById('gov-blackspots-tbody');
  if (!tbody) return;

  if (!res.success || !res.data || res.data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">No high-risk blackspots currently flagged.</td></tr>`;
    return;
  }

  tbody.innerHTML = res.data
    .map(
      (b) => `
    <tr>
      <td><span class="fw-bold text-cyan">${b.blackspotId}</span></td>
      <td>
        <div class="fw-bold text-white">${b.roadName}</div>
        <small class="text-muted">${b.district}, ${b.state}</small>
      </td>
      <td>${Utils.getRiskBadge(b.riskScore)}</td>
      <td>
        <div class="small text-muted">Accidents: <span class="text-danger fw-bold">${b.historicalAccidentsCount}</span></div>
        <div class="small text-muted">Near-Misses: <span class="text-warning fw-bold">${b.nearMissCount}</span></div>
      </td>
      <td>
        <ul class="mb-0 ps-3 small text-muted">
          ${(b.recommendations || []).slice(0, 2).map((r) => `<li>${r}</li>`).join('')}
        </ul>
      </td>
      <td><span class="badge bg-secondary">${b.status.replace(/_/g, ' ')}</span></td>
    </tr>
  `
    )
    .join('');
}
