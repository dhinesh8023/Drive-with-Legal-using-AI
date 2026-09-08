let role = null;

async function loadBlackspots() {
  const container = document.getElementById("blackspotsList");
  try {
    const { blackspots } = await api.get("/blackspots");
    if (!blackspots.length) {
      container.innerHTML = `<div class="empty-state">No blackspot predictions yet. ${role !== "USER" ? "Use the form below to calculate one." : ""}</div>`;
      return;
    }
    container.innerHTML = blackspots
      .map((b) => {
        const riskClass = { LOW: "SAFE", MODERATE: "MODERATE", HIGH: "HIGH", CRITICAL: "CRITICAL" }[b.riskLevel];
        return `<div class="glass-card" style="margin-bottom:12px;">
          <div class="flex justify-between items-center">
            <div>
              <strong>${b.location.roadName || `${b.location.latitude.toFixed(4)}, ${b.location.longitude.toFixed(4)}`}</strong>
              <div class="text-muted" style="font-size:11px;">${b.location.district || ""}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:24px; font-weight:800;">${b.riskPercentage}%</div>
              <span class="risk-badge risk-${riskClass}">${b.riskLevel} RISK</span>
            </div>
          </div>
          <div class="grid grid-cols-4" style="margin-top:12px; font-size:12px;">
            <div>Accidents: <strong>${b.contributingFactors.historicalAccidentCount}</strong></div>
            <div>Near Misses: <strong>${b.contributingFactors.nearMissCount}</strong></div>
            <div>Hazard Reports: <strong>${b.contributingFactors.hazardReportCount}</strong></div>
            <div>Violation Density: <strong>${b.contributingFactors.violationDensity}</strong></div>
          </div>
          ${
            b.recommendations?.length
              ? `<div style="margin-top:10px; font-size:12.5px;" class="text-secondary">Recommendations: ${b.recommendations.join(", ")}</div>`
              : ""
          }
          <div class="text-muted" style="font-size:10.5px; margin-top:8px;">AI-assisted risk estimate — not an official designation.</div>
        </div>`;
      })
      .join("");
  } catch (err) {
    container.innerHTML = `<div class="empty-state">${err.message}</div>`;
  }
}

async function recalculate(e) {
  e.preventDefault();
  const form = e.target;
  try {
    await api.post("/blackspots/recalculate", {
      latitude: parseFloat(form.latitude.value),
      longitude: parseFloat(form.longitude.value),
      roadName: form.roadName.value,
      district: form.district.value,
      historicalAccidentCount: Number(form.historicalAccidentCount.value) || 0,
    });
    Utils.toast("Blackspot risk recalculated.", "success");
    form.reset();
    loadBlackspots();
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const user = renderShell("blackspots", "Blackspot Prediction");
  if (!user) return;
  role = user.role;

  if (role !== "USER") {
    document.getElementById("recalcSection").style.display = "block";
    document.getElementById("recalcForm").addEventListener("submit", recalculate);
  }

  loadBlackspots();
});
