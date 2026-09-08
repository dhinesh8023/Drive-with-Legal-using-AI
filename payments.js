async function loadPayments() {
  const tbody = document.getElementById("paymentsBody");
  try {
    const { payments } = await api.get("/payments");
    if (!payments.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No payments yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = payments
      .map((p) => {
        const pillClass = { SUCCESS: "pill-success", FAILED: "pill-failed", PROCESSING: "pill-review", INITIATED: "pill-pending", PENDING: "pill-pending" }[p.status];
        return `<tr>
          <td>${p.transactionReference}</td>
          <td>${p.fine?.fineCode || "-"}</td>
          <td>&#8377;${p.amount}</td>
          <td>${p.method.replace(/_/g, " ")}${p.isDemo ? ' <span class="pill pill-review">DEMO</span>' : ""}</td>
          <td><span class="pill ${pillClass}">${p.status}</span></td>
          <td>${p.status === "SUCCESS" && p.fine ? `<a class="btn btn-sm btn-ghost" href="${CONFIG.API_BASE_URL}/receipts/${p.fine._id || p.fine}" target="_blank"><i class="bi bi-download"></i> Receipt</a>` : new Date(p.createdAt).toLocaleDateString()}</td>
        </tr>`;
      })
      .join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${err.message}</td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const user = renderShell("payments", "Payments");
  if (!user) return;
  loadPayments();
});
