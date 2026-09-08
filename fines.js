let role = null;

async function loadFines() {
  const tbody = document.getElementById("finesBody");
  try {
    const { fines } = await api.get("/fines");
    if (!fines.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No fines found.</td></tr>`;
      return;
    }
    tbody.innerHTML = fines
      .map((f) => {
        const pillClass = { PENDING: "pill-pending", PAID: "pill-paid", OVERDUE: "pill-overdue", DISPUTED: "pill-review", UNDER_REVIEW: "pill-review", CANCELLED: "pill-rejected" }[f.status];
        return `<tr>
          <td>${f.fineCode}</td>
          <td>${f.violation?.violationType?.replace(/_/g, " ") || "-"}</td>
          <td>&#8377;${f.amount}</td>
          <td>${new Date(f.dueDate).toLocaleDateString()}</td>
          <td><span class="pill ${pillClass}">${f.status}</span></td>
          <td>
            ${role === "USER" && f.status === "PENDING" ? `<button class="btn btn-sm btn-primary" onclick="payFine('${f._id}')">Pay</button>` : ""}
            ${f.status === "PAID" ? `<a class="btn btn-sm btn-ghost" href="${CONFIG.API_BASE_URL}/receipts/${f._id}" target="_blank">Receipt</a>` : ""}
            ${["POLICE", "ADMIN"].includes(role) && f.status === "PENDING" ? `<button class="btn btn-sm btn-outline" onclick="remindFine('${f._id}')">Remind</button>` : ""}
          </td>
        </tr>`;
      })
      .join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${err.message}</td></tr>`;
  }
}

async function payFine(fineId) {
  document.getElementById("payFineId").value = fineId;
  document.getElementById("payModal").style.display = "flex";
}
function closePayModal() {
  document.getElementById("payModal").style.display = "none";
}

async function submitPayment() {
  const fineId = document.getElementById("payFineId").value;
  const method = document.querySelector('input[name="payMethod"]:checked').value;
  try {
    const { payment } = await api.post("/payments/create", { fineId, method });
    Utils.toast("Payment initiated. Verifying...", "info");
    const result = await api.post("/payments/verify", { transactionReference: payment.transactionReference });
    Utils.toast(result.payment.status === "SUCCESS" ? "Payment successful!" : "Payment failed.", result.payment.status === "SUCCESS" ? "success" : "error");
    closePayModal();
    loadFines();
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

async function remindFine(fineId) {
  try {
    const result = await api.post(`/fines/${fineId}/remind`);
    Utils.toast(result.message || "Reminder sent.", "success");
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

async function loadFineRules() {
  const container = document.getElementById("fineRulesSection");
  if (!container) return;
  try {
    const { rules } = await api.get("/fine-rules");
    document.getElementById("fineRulesBody").innerHTML = rules
      .map(
        (r) => `<tr>
          <td>${r.violationType.replace(/_/g, " ")}</td>
          <td>&#8377;${r.baseFineAmount}</td>
          <td>${r.duePeriodDays} days</td>
          <td>${r.isActive ? '<span class="pill pill-approved">Active</span>' : '<span class="pill pill-rejected">Inactive</span>'}</td>
        </tr>`
      )
      .join("");
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

async function saveFineRule(e) {
  e.preventDefault();
  const form = e.target;
  try {
    await api.post("/fine-rules", {
      violationType: form.violationType.value,
      baseFineAmount: Number(form.baseFineAmount.value),
      description: form.description.value,
      duePeriodDays: Number(form.duePeriodDays.value) || 15,
    });
    Utils.toast("Fine rule saved (DEMO / configured amount).", "success");
    form.reset();
    loadFineRules();
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const user = renderShell("fine-management", "Fine Management");
  if (!user) return;
  role = user.role;

  if (role === "ADMIN") {
    document.getElementById("fineRulesSection").style.display = "block";
    document.getElementById("fineRuleForm").addEventListener("submit", saveFineRule);
    loadFineRules();
  }

  loadFines();
});
