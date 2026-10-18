/**
 * DRIVE LEGAL AI — COMMUTER DASHBOARD CONTROLLER (DASHBOARD.JS)
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth()) return;
  Utils.initNavigation();

  const user = Auth.getUser();
  const welcomeEl = document.getElementById('welcome-user-name');
  if (welcomeEl) welcomeEl.textContent = user.name;

  await loadDashboardData();
  initSafetyChart();
});

async function loadDashboardData() {
  try {
    const user = Auth.getUser();

    // 1. Load Vehicles
    const vRes = await API.get('/vehicles');
    const vehicleCountEl = document.getElementById('user-vehicle-count');
    const activePlateEl = document.getElementById('active-vehicle-plate');
    if (vRes.success && vRes.data && vRes.data.length > 0) {
      if (vehicleCountEl) vehicleCountEl.textContent = vRes.data.length;
      if (activePlateEl) activePlateEl.textContent = vRes.data[0].vehicleNumber;
    }

    // 2. Load FASTag Balance
    const ftRes = await API.get('/fastag');
    const ftBalanceEl = document.getElementById('fastag-balance-val');
    if (ftRes.success && ftRes.data) {
      if (ftBalanceEl) ftBalanceEl.textContent = Utils.formatCurrency(ftRes.data.currentBalance);
    }

    // 3. Load Pending Fines
    const fRes = await API.get('/fines', { status: 'PENDING' });
    const pendingFinesCountEl = document.getElementById('pending-fines-count');
    const pendingFinesAmountEl = document.getElementById('pending-fines-total');
    if (fRes.success && fRes.data) {
      if (pendingFinesCountEl) pendingFinesCountEl.textContent = fRes.data.length;
      const totalAmt = fRes.data.reduce((sum, f) => sum + f.fineAmount, 0);
      if (pendingFinesAmountEl) pendingFinesAmountEl.textContent = Utils.formatCurrency(totalAmt);
      renderRecentFines(fRes.data.slice(0, 5));
    }

    // 4. Load Next Road Hazard
    const hRes = await API.get('/hazards', { status: 'ACTIVE' });
    const hazardTitleEl = document.getElementById('next-hazard-title');
    const hazardDescEl = document.getElementById('next-hazard-desc');
    if (hRes.success && hRes.data && hRes.data.length > 0) {
      const topHazard = hRes.data[0];
      if (hazardTitleEl) hazardTitleEl.textContent = `${topHazard.hazardType} (${topHazard.severity})`;
      if (hazardDescEl) hazardDescEl.textContent = `${topHazard.locationName}: ${topHazard.description}`;
    }

    // 5. Driver Safety Score
    const userScore = user?.driverScore || 92;
    const scoreValEl = document.getElementById('driver-score-val');
    const scoreCategoryEl = document.getElementById('driver-score-category');
    if (scoreValEl) scoreValEl.textContent = `${userScore}/100`;
    if (scoreCategoryEl) {
      if (userScore >= 90) scoreCategoryEl.textContent = 'EXCELLENT DRIVER';
      else if (userScore >= 75) scoreCategoryEl.textContent = 'GOOD DRIVER';
      else if (userScore >= 50) scoreCategoryEl.textContent = 'NEEDS IMPROVEMENT';
      else scoreCategoryEl.textContent = 'HIGH RISK DRIVER';
    }
  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

function renderRecentFines(fines) {
  const container = document.getElementById('dashboard-fines-tbody');
  if (!container) return;

  if (fines.length === 0) {
    container.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No pending traffic violation fines. Safe driving record!</td></tr>`;
    return;
  }

  container.innerHTML = fines
    .map(
      (f) => `
    <tr>
      <td><span class="fw-bold text-cyan">${f.fineId}</span></td>
      <td>${f.violationType}</td>
      <td><span class="badge bg-secondary">${f.vehicleNumber}</span></td>
      <td class="fw-bold text-warning">${Utils.formatCurrency(f.fineAmount)}</td>
      <td>
        <a href="payments.html?fineId=${f._id}" class="btn-dl btn-dl-primary" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;">
          Pay Now
        </a>
      </td>
    </tr>
  `
    )
    .join('');
}

function initSafetyChart() {
  const ctx = document.getElementById('safetyTrendChart');
  if (!ctx || typeof Chart === 'undefined') return;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'AI Safety Score',
          data: [88, 92, 90, 85, 94, 91, 95],
          borderColor: '#00f0ff',
          backgroundColor: 'rgba(0, 240, 255, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointBackgroundColor: '#00f0ff',
        },
        {
          label: 'Road Risk Level',
          data: [25, 20, 35, 18, 15, 22, 10],
          borderColor: '#ef4444',
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          borderWidth: 1.5,
          pointBackgroundColor: '#ef4444',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#94a3b8' } },
      },
      scales: {
        x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
        y: {
          min: 0,
          max: 100,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8' },
        },
      },
    },
  });
}
