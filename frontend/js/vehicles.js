async function loadVehicles() {
  const tbody = document.getElementById("vehiclesBody");
  try {
    const { vehicles } = await api.get("/vehicles");
    if (!vehicles.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No vehicles registered yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = vehicles
      .map(
        (v) => `<tr>
          <td><strong>${v.vehicleNumber}</strong></td>
          <td>${v.vehicleType.replace("_", " ")}</td>
          <td>${v.brand || "-"} ${v.model || ""}</td>
          <td>${v.year || "-"}</td>
          <td>${v.fastagId || "-"}</td>
          <td><button class="btn btn-ghost btn-sm" onclick="removeVehicle('${v._id}')"><i class="bi bi-trash"></i></button></td>
        </tr>`
      )
      .join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${err.message}</td></tr>`;
  }
}

async function removeVehicle(id) {
  if (!confirm("Remove this vehicle?")) return;
  try {
    await api.delete(`/vehicles/${id}`);
    Utils.toast("Vehicle removed.", "success");
    loadVehicles();
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

function openAddVehicleModal() {
  document.getElementById("addVehicleModal").style.display = "flex";
}
function closeAddVehicleModal() {
  document.getElementById("addVehicleModal").style.display = "none";
}

async function submitVehicle(e) {
  e.preventDefault();
  const form = e.target;
  try {
    await api.post("/vehicles", {
      vehicleNumber: form.vehicleNumber.value,
      vehicleType: form.vehicleType.value,
      brand: form.brand.value,
      model: form.model.value,
      year: Number(form.year.value) || undefined,
      fastagId: form.fastagId.value || undefined,
    });
    Utils.toast("Vehicle registered.", "success");
    closeAddVehicleModal();
    form.reset();
    loadVehicles();
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const user = renderShell("vehicles", "My Vehicles");
  if (!user) return;
  document.getElementById("addVehicleForm").addEventListener("submit", submitVehicle);
  loadVehicles();
});
