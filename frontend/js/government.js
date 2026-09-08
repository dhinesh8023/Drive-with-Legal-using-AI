async function loadGovDashboard() {
  try {
    const summary = await api.get("/analytics/dashboard");
    document.getElementById("statTotalViolations").textContent = summary.totalViolations;
    document.getElementById("statTotalFines").textContent = summary.totalFines;
    document.getElementById("statCollection").textContent = "\u20b9" + summary.totalCollection.toLocaleString();
    document.getElementById("statPendingCollection").textContent = "\u20b9" + summary.pendingCollection.toLocaleString();
    document.getElementById("statOverdueFines").textContent = summary.overdueFines;
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

async function loadTopBlackspots() {
  const container = document.getElementById("topBlackspots");
  try {
    const { blackspots } = await api.get("/blackspots");
    if (!blackspots.length) {
      container.innerHTML = `<div class="empty-state">No blackspot predictions yet.</div>`;
      return;
    }
    container.innerHTML = blackspots
      .slice(0, 5)
      .map(
        (b) => `<div class="flex justify-between items-center" style="padding:8px 0; border-bottom:1px solid var(--border-subtle);">
          <span>${b.location.roadName || `${b.location.latitude.toFixed(3)}, ${b.location.longitude.toFixed(3)}`}</span>
          <span class="risk-badge risk-${b.riskLevel === "LOW" ? "SAFE" : b.riskLevel}">${b.riskPercentage}%</span>
        </div>`
      )
      .join("");
  } catch (err) {
    container.innerHTML = `<div class="empty-state">${err.message}</div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const user = renderShell("government-dashboard", "Government Dashboard");
  if (!user) return;
  loadGovDashboard();
  loadTopBlackspots();
});
