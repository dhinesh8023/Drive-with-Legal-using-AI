let pendingEventId = null;

async function loadEmergencyHistory() {
  const tbody = document.getElementById("emergencyBody");
  try {
    const { events } = await api.get("/emergency");
    if (!events.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="empty-state">No emergency events recorded.</td></tr>`;
      return;
    }
    tbody.innerHTML = events
      .map(
        (e) => `<tr>
        <td>${e.triggerReason.replace(/_/g, " ")}</td>
        <td><span class="pill ${e.status === "RESOLVED" || e.status === "CONFIRMED_FALSE_ALARM" ? "pill-approved" : "pill-overdue"}">${e.status.replace(/_/g, " ")}</span></td>
        <td>${new Date(e.createdAt).toLocaleString()}</td>
        <td>${e.userRespondedAt ? new Date(e.userRespondedAt).toLocaleString() : "-"}</td>
      </tr>`
      )
      .join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-state">${err.message}</td></tr>`;
  }
}

function captureLocation(cb) {
  if (!navigator.geolocation) return cb(null);
  navigator.geolocation.getCurrentPosition(
    (pos) => cb({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
    () => cb(null)
  );
}

async function triggerManualSOS() {
  if (!confirm("This will create a simulated emergency event. No real emergency service will be contacted automatically. Continue?")) return;

  captureLocation(async (location) => {
    try {
      const { event } = await api.post("/emergency/detect", { triggerReason: "MANUAL", location });
      pendingEventId = event._id;
      document.getElementById("sosConfirmPanel").style.display = "block";
      Utils.toast("Emergency event created (simulated). Please confirm your status.", "info");
      loadEmergencyHistory();
    } catch (err) {
      Utils.toast(err.message, "error");
    }
  });
}

async function respond(confirmedOkay) {
  if (!pendingEventId) return;
  try {
    const result = await api.post(`/emergency/${pendingEventId}/respond`, { confirmed: confirmedOkay });
    Utils.toast(result.message, confirmedOkay ? "success" : "info");
    document.getElementById("sosConfirmPanel").style.display = "none";
    pendingEventId = null;
    loadEmergencyHistory();
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const user = renderShell("emergency", "Emergency");
  if (!user) return;
  document.getElementById("sosBtn").addEventListener("click", triggerManualSOS);
  document.getElementById("respondOkayBtn").addEventListener("click", () => respond(true));
  document.getElementById("respondHelpBtn").addEventListener("click", () => respond(false));
  loadEmergencyHistory();
});
