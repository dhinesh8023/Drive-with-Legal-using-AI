async function loadAdminSummary() {
  try {
    const summary = await api.get("/analytics/dashboard");
    document.getElementById("statTotalViolations").textContent = summary.totalViolations;
    document.getElementById("statTotalFines").textContent = summary.totalFines;
    document.getElementById("statCollection").textContent = "\u20b9" + summary.totalCollection.toLocaleString();
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

async function loadPendingStaff() {
  const tbody = document.getElementById("pendingStaffBody");
  try {
    const [{ users: police }, { users: gov }] = await Promise.all([
      api.get("/users?role=POLICE"),
      api.get("/users?role=GOVERNMENT_STAFF"),
    ]);
    const pending = [...police, ...gov].filter((u) => !u.isStaffApproved);

    if (!pending.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No pending staff approvals.</td></tr>`;
      return;
    }
    tbody.innerHTML = pending
      .map(
        (u) => `<tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.role.replace("_", " ")}</td>
        <td>${u.officerId || "-"} / ${u.organizationId || "-"}</td>
        <td><button class="btn btn-sm btn-primary" onclick="approveStaff('${u._id}')">Approve</button></td>
      </tr>`
      )
      .join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">${err.message}</td></tr>`;
  }
}

async function approveStaff(id) {
  try {
    await api.put(`/users/${id}`, { isStaffApproved: true });
    Utils.toast("Staff account approved.", "success");
    loadPendingStaff();
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const user = renderShell("admin-dashboard", "Admin Dashboard");
  if (!user) return;
  loadAdminSummary();
  loadPendingStaff();
});
