async function loadHazards() {
  const tbody = document.getElementById("hazardsBody");
  try {
    const { hazards } = await api.get("/hazards");
    if (!hazards.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No hazards reported yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = hazards
      .map(
        (h) => `<tr>
        <td>${h.hazardType.replace(/_/g, " ")}</td>
        <td><span class="pill ${h.severity === "CRITICAL" || h.severity === "HIGH" ? "pill-overdue" : "pill-pending"}">${h.severity}</span></td>
        <td>${h.location?.address || `${h.location.latitude.toFixed(4)}, ${h.location.longitude.toFixed(4)}`}</td>
        <td>${Math.round((h.confidenceScore || 0) * 100)}%${h.isVerified ? ' <i class="bi bi-patch-check-fill text-safe"></i>' : ""}</td>
        <td>${new Date(h.createdAt).toLocaleDateString()}</td>
      </tr>`
      )
      .join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">${err.message}</td></tr>`;
  }
}

function useMyLocation() {
  if (!navigator.geolocation) {
    Utils.toast("Geolocation not supported by this browser.", "error");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      document.querySelector('input[name="latitude"]').value = pos.coords.latitude.toFixed(6);
      document.querySelector('input[name="longitude"]').value = pos.coords.longitude.toFixed(6);
      Utils.toast("Location captured.", "success");
    },
    () => Utils.toast("Could not get location. Enter coordinates manually.", "info")
  );
}

async function submitHazard(e) {
  e.preventDefault();
  const form = e.target;
  const lat = parseFloat(form.latitude.value);
  const lng = parseFloat(form.longitude.value);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    Utils.toast("Latitude and longitude are required.", "error");
    return;
  }
  try {
    await api.post("/hazards", {
      hazardType: form.hazardType.value,
      severity: form.severity.value,
      description: form.description.value,
      location: { latitude: lat, longitude: lng, address: form.address.value },
    });
    Utils.toast("Hazard reported. Thank you.", "success");
    form.reset();
    loadHazards();
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const user = renderShell("hazards", "Report Hazard");
  if (!user) return;
  document.getElementById("hazardForm").addEventListener("submit", submitHazard);
  document.getElementById("useLocationBtn").addEventListener("click", useMyLocation);
  loadHazards();
});
