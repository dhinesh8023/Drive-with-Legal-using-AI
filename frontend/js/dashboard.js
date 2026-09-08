async function loadDashboard() {
  const user = renderShell("dashboard", "Dashboard");
  if (!user) return;

  qs("#welcomeName").textContent = user.name;
  qs("#safeScoreValue").textContent = user.safeDriverScore ?? "--";

  try {
    const [{ vehicles }, { fines }, fastagResult] = await Promise.all([
      api.get("/vehicles"),
      api.get("/fines"),
      api.get("/fastag").catch(() => ({ accounts: [] })),
    ]);

    qs("#vehicleCount").textContent = vehicles.length;
    const pending = fines.filter((f) => f.status === "PENDING" || f.status === "OVERDUE");
    const paid = fines.filter((f) => f.status === "PAID");
    qs("#pendingFinesValue").textContent = pending.length;
    qs("#paidFinesValue").textContent = paid.length;

    const totalBalance = (fastagResult.accounts || []).reduce((sum, a) => sum + (a.demoBalance || 0), 0);
    qs("#fastagBalanceValue").textContent = formatCurrency(totalBalance);

    renderRecentFines(fines.slice(0, 5));
  } catch (err) {
    showToast(err.message, "error");
  }
}

function renderRecentFines(fines) {
  const tbody = qs("#recentFinesBody");
  if (!fines.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-state">No fines yet. Safe driving! 🎉</td></tr>`;
    return;
  }
  tbody.innerHTML = fines
    .map(
      (f) => `<tr>
        <td>${f.fineCode}</td>
        <td>${formatCurrency(f.amount)}</td>
        <td>${formatDate(f.dueDate)}</td>
        <td>${statusPillHtml(f.status)}</td>
      </tr>`
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", loadDashboard);
