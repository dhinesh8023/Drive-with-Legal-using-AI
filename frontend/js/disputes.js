let role = null;

async function loadDisputes() {
  const tbody = document.getElementById("disputesBody");
  try {
    const { disputes } = await api.get("/disputes");
    if (!disputes.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No disputes found.</td></tr>`;
      return;
    }
    tbody.innerHTML = disputes
      .map((d) => {
        const pillClass = { RECEIVED: "pill-pending", UNDER_REVIEW: "pill-review", ACCEPTED: "pill-approved", REJECTED: "pill-rejected", MORE_INFO_REQUESTED: "pill-review" }[d.status];
        return `<tr>
          <td>${d.fine?.fineCode || "-"}</td>
          <td>${d.reason}</td>
          <td>${d.user?.name || "-"}</td>
          <td><span class="pill ${pillClass}">${d.status.replace(/_/g, " ")}</span></td>
          <td>${new Date(d.createdAt).toLocaleDateString()}</td>
          <td>${["POLICE", "ADMIN"].includes(role) && d.status === "RECEIVED" ? `<button class="btn btn-sm btn-outline" onclick="openReview('${d._id}')">Review</button>` : ""}</td>
        </tr>`;
      })
      .join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${err.message}</td></tr>`;
  }
}

async function populateFineOptions() {
  const select = document.querySelector('select[name="fineId"]');
  if (!select) return;
  try {
    const { fines } = await api.get("/fines?status=PENDING");
    select.innerHTML = fines.length
      ? fines.map((f) => `<option value="${f._id}">${f.fineCode} - \u20b9${f.amount}</option>`).join("")
      : `<option value="">No pending fines to dispute</option>`;
  } catch (err) {
    /* non-fatal */
  }
}

async function submitDispute(e) {
  e.preventDefault();
  const form = e.target;
  try {
    await api.post("/disputes", {
      fineId: form.fineId.value,
      reason: form.reason.value,
      description: form.description.value,
    });
    Utils.toast("Dispute submitted.", "success");
    form.reset();
    loadDisputes();
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

let reviewingId = null;
function openReview(id) {
  reviewingId = id;
  document.getElementById("disputeReviewModal").style.display = "flex";
}
function closeReview() {
  document.getElementById("disputeReviewModal").style.display = "none";
}

async function submitDisputeReview(decision) {
  const note = document.getElementById("disputeReviewNote").value;
  try {
    await api.post(`/disputes/${reviewingId}/review`, { decision, note });
    Utils.toast(`Dispute marked as ${decision}.`, "success");
    closeReview();
    loadDisputes();
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const user = renderShell("disputes", "Disputes");
  if (!user) return;
  role = user.role;

  if (role === "USER") {
    document.getElementById("newDisputeSection").style.display = "block";
    document.getElementById("newDisputeForm").addEventListener("submit", submitDispute);
    populateFineOptions();
  }

  loadDisputes();
});
