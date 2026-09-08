async function loadPoliceDashboard() {
  try {
    const summary = await api.get("/analytics/dashboard");
    document.getElementById("statTotalViolations").textContent = summary.totalViolations;
    document.getElementById("statPendingReview").textContent = summary.pendingReview;
    document.getElementById("statTotalFines").textContent = summary.totalFines;
    document.getElementById("statPaidFines").textContent = summary.paidFines;
    document.getElementById("statPendingFines").textContent = summary.pendingFines;
    document.getElementById("statOverdueFines").textContent = summary.overdueFines;
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

async function loadPendingQueue() {
  const tbody = document.getElementById("pendingQueueBody");
  try {
    const { violations } = await api.get("/violations?status=PENDING_REVIEW");
    if (!violations.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No violations awaiting review.</td></tr>`;
      return;
    }
    tbody.innerHTML = violations
      .slice(0, 10)
      .map(
        (v) => `<tr>
        <td>${v.vehicleNumber}</td>
        <td>${v.violationType.replace(/_/g, " ")}</td>
        <td>${Math.round((v.aiConfidence || 0) * 100)}%</td>
        <td>${new Date(v.occurredAt).toLocaleString()}</td>
        <td><a class="btn btn-sm btn-outline" href="violations.html">Review</a></td>
      </tr>`
      )
      .join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">${err.message}</td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const user = renderShell("police-dashboard", "Police Dashboard");
  if (!user) return;
  loadPoliceDashboard();
  loadPendingQueue();
});
