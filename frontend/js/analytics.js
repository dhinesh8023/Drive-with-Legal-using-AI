let charts = {};

function renderChart(id, config) {
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(document.getElementById(id), config);
}

const CHART_COLORS = ["#2f6fed", "#22d3ee", "#eab308", "#f97316", "#ef4444", "#22c55e", "#a78bfa", "#f472b6"];

function baseOptions(extra = {}) {
  return {
    responsive: true,
    plugins: { legend: { labels: { color: "#96a3b8" } } },
    scales: {
      x: { ticks: { color: "#5c6879" }, grid: { color: "rgba(255,255,255,0.05)" } },
      y: { ticks: { color: "#5c6879" }, grid: { color: "rgba(255,255,255,0.05)" } },
    },
    ...extra,
  };
}

async function loadSummary() {
  try {
    const summary = await api.get("/analytics/dashboard");
    document.getElementById("statViolations").textContent = summary.totalViolations;
    document.getElementById("statPendingReview").textContent = summary.pendingReview;
    document.getElementById("statCollection").textContent = "\u20b9" + summary.totalCollection.toLocaleString();
    document.getElementById("statPendingCollection").textContent = "\u20b9" + summary.pendingCollection.toLocaleString();
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

async function loadViolationCharts() {
  try {
    const { byType, byDistrict } = await api.get("/analytics/violations");
    renderChart("violationTypeChart", {
      type: "bar",
      data: {
        labels: byType.map((b) => (b._id || "Unknown").replace(/_/g, " ")),
        datasets: [{ label: "Violations", data: byType.map((b) => b.count), backgroundColor: CHART_COLORS }],
      },
      options: baseOptions(),
    });

    renderChart("violationDistrictChart", {
      type: "doughnut",
      data: {
        labels: byDistrict.map((b) => b._id || "Unspecified"),
        datasets: [{ data: byDistrict.map((b) => b.count), backgroundColor: CHART_COLORS }],
      },
      options: baseOptions({ scales: undefined }),
    });
  } catch (err) {
    /* non-fatal */
  }
}

async function loadPaymentCharts() {
  try {
    const { byMethod, trend } = await api.get("/analytics/payments");
    renderChart("paymentMethodChart", {
      type: "pie",
      data: {
        labels: byMethod.map((b) => b._id),
        datasets: [{ data: byMethod.map((b) => b.total), backgroundColor: CHART_COLORS }],
      },
      options: baseOptions({ scales: undefined }),
    });

    renderChart("collectionTrendChart", {
      type: "line",
      data: {
        labels: trend.map((t) => t._id),
        datasets: [{ label: "Collection (\u20b9)", data: trend.map((t) => t.total), borderColor: "#22d3ee", backgroundColor: "rgba(34,211,238,0.15)", fill: true, tension: 0.3 }],
      },
      options: baseOptions(),
    });
  } catch (err) {
    /* non-fatal */
  }
}

async function loadNearMissChart() {
  try {
    const { trend } = await api.get("/analytics/near-misses");
    renderChart("nearMissTrendChart", {
      type: "line",
      data: {
        labels: trend.map((t) => t._id),
        datasets: [{ label: "Near-Miss Events", data: trend.map((t) => t.count), borderColor: "#f97316", backgroundColor: "rgba(249,115,22,0.15)", fill: true, tension: 0.3 }],
      },
      options: baseOptions(),
    });
  } catch (err) {
    /* non-fatal */
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const user = renderShell("analytics", "Analytics");
  if (!user) return;
  loadSummary();
  loadViolationCharts();
  loadPaymentCharts();
  loadNearMissChart();
});
