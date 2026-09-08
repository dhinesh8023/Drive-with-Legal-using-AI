async function loadFleet() {
  const tbody = document.getElementById("fleetBody");
  try {
    const { users } = await api.get("/users?role=USER");
    const { vehicles } = await api.get("/vehicles");

    const vehiclesByOwner = {};
    vehicles.forEach((v) => {
      const ownerId = v.owner?._id || v.owner;
      vehiclesByOwner[ownerId] = vehiclesByOwner[ownerId] || [];
      vehiclesByOwner[ownerId].push(v);
    });

    if (!users.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="empty-state">No registered drivers found.</td></tr>`;
      return;
    }

    tbody.innerHTML = users
      .map((u) => {
        const vCount = (vehiclesByOwner[u._id] || []).length;
        const score = u.safeDriverScore ?? 85;
        const category = score >= 90 ? "EXCELLENT" : score >= 75 ? "GOOD" : score >= 50 ? "NEEDS IMPROVEMENT" : "HIGH RISK";
        const colorClass = score >= 90 ? "text-safe" : score >= 75 ? "text-safe" : score >= 50 ? "text-moderate" : "text-critical";
        return `<tr>
          <td>${u.name}</td>
          <td>${vCount} vehicle(s)</td>
          <td class="${colorClass}" style="font-weight:700;">${score}/100</td>
          <td>${category}</td>
        </tr>`;
      })
      .join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-state">${err.message}</td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const user = renderShell("fleet", "Fleet Overview");
  if (!user) return;
  loadFleet();
});
