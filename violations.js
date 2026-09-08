let currentUserRole = null;

async function loadViolations() {
  const tbody = document.getElementById("violationsBody");
  try {
    const { violations } = await api.get("/violations");
    if (!violations.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No violations found.</td></tr>`;
      return;
    }
    const canReview = ["POLICE", "ADMIN"].includes(currentUserRole);

    tbody.innerHTML = violations
      .map((v) => {
        const confidence = v.aiConfidence != null ? Math.round(v.aiConfidence * 100) + "%" : "-";
        const statusPill = {
          PENDING_REVIEW: "pill-pending",
          APPROVED: "pill-approved",
          REJECTED: "pill-rejected",
          MORE_REVIEW_REQUIRED: "pill-review",
        }[v.reviewStatus];

        return `<tr>
          <td>${v.vehicleNumber}</td>
          <td>${v.violationType.replace(/_/g, " ")}</td>
          <td>${new Date(v.occurredAt).toLocaleString()}</td>
          <td>${confidence}</td>
          <td><span class="pill ${statusPill}">${v.reviewStatus.replace(/_/g, " ")}</span></td>
          <td>${v.location?.roadName || v.location?.address || "-"}</td>
          <td>
            ${
              canReview && v.reviewStatus === "PENDING_REVIEW"
                ? `<button class="btn btn-sm btn-outline" onclick="openReview('${v._id}')">Review</button>`
                : `<button class="btn btn-sm btn-ghost" onclick="viewDetail('${v._id}')">View</button>`
            }
          </td>
        </tr>`;
      })
      .join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">${err.message}</td></tr>`;
  }
}

async function viewDetail(id) {
  const { violation } = await api.get(`/violations/${id}`);
  alert(
    `Violation: ${violation.violationType}\nAI Confidence: ${Math.round((violation.aiConfidence || 0) * 100)}%\nStatus: ${violation.reviewStatus}\nOfficer Notes: ${violation.officerNotes || "-"}`
  );
}

let reviewingId = null;
function openReview(id) {
  reviewingId = id;
  document.getElementById("reviewModal").style.display = "flex";
}
function closeReview() {
  document.getElementById("reviewModal").style.display = "none";
  reviewingId = null;
}

async function submitReview(decision) {
  const notes = document.getElementById("officerNotes").value;
  try {
    await api.post(`/violations/${reviewingId}/review`, { decision, notes });
    Utils.toast(`Violation marked as ${decision}.`, "success");
    closeReview();
    loadViolations();
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const user = renderShell("violations", "Violations");
  if (!user) return;
  currentUserRole = user.role;
  loadViolations();
});
