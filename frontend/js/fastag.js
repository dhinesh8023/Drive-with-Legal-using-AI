let myAccounts = [];

async function loadFastag() {
  try {
    const { accounts } = await api.get("/fastag");
    myAccounts = accounts || [];
    renderAccounts();
  } catch (err) {
    document.getElementById("fastagAccountsList").innerHTML = `<div class="empty-state">${err.message}</div>`;
  }
}

function renderAccounts() {
  const container = document.getElementById("fastagAccountsList");
  if (!myAccounts.length) {
    container.innerHTML = `<div class="empty-state">No FASTag linked yet. Link one to a vehicle below.</div>`;
    return;
  }

  container.innerHTML = myAccounts
    .map(
      (acc) => `
    <div class="glass-card accented" style="margin-bottom:14px;">
      <div class="flex justify-between items-center">
        <div>
          <div class="text-muted" style="font-size:11px;">FASTag ID</div>
          <div style="font-weight:700;">${acc.fastagId}</div>
          <div class="text-secondary" style="font-size:12px;">Vehicle: ${acc.vehicle?.vehicleNumber || "-"}</div>
        </div>
        <div style="text-align:right;">
          <div class="text-muted" style="font-size:11px;">Demo Balance</div>
          <div style="font-size:22px; font-weight:800;">&#8377;${acc.demoBalance}</div>
          <button class="btn btn-sm btn-outline" onclick="rechargeFastag('${acc._id}')">Recharge</button>
        </div>
      </div>
      <table class="data-table" style="margin-top:12px;">
        <thead><tr><th>Type</th><th>Amount</th><th>Balance After</th><th>Date</th></tr></thead>
        <tbody>
          ${
            (acc.transactions || []).length
              ? [...acc.transactions]
                  .reverse()
                  .map(
                    (t) => `<tr><td>${t.type.replace(/_/g, " ")}</td><td>&#8377;${t.amount}</td><td>&#8377;${t.balanceAfter}</td><td>${new Date(t.createdAt || Date.now()).toLocaleString()}</td></tr>`
                  )
                  .join("")
              : `<tr><td colspan="4" class="empty-state">No transactions yet.</td></tr>`
          }
        </tbody>
      </table>
    </div>`
    )
    .join("");
}

async function linkFastag(e) {
  e.preventDefault();
  const form = e.target;
  try {
    await api.post("/fastag/link", { vehicleId: form.vehicleId.value, fastagId: form.fastagId.value || undefined });
    Utils.toast("FASTag linked (demo mode).", "success");
    form.reset();
    loadFastag();
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

async function rechargeFastag(accountId) {
  const amount = Number(prompt("Enter demo recharge amount (\u20b9):", "500"));
  if (!amount || amount <= 0) return;
  try {
    await api.post("/fastag/recharge", { accountId, amount });
    Utils.toast("Recharge successful (demo).", "success");
    loadFastag();
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

async function populateVehicleOptions() {
  try {
    const { vehicles } = await api.get("/vehicles");
    const select = document.querySelector('select[name="vehicleId"]');
    select.innerHTML = vehicles.length
      ? vehicles.map((v) => `<option value="${v._id}">${v.vehicleNumber}</option>`).join("")
      : `<option value="">No vehicles registered</option>`;
  } catch (err) {
    /* non-fatal */
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const user = renderShell("fastag", "FASTag");
  if (!user) return;
  document.getElementById("linkFastagForm").addEventListener("submit", linkFastag);
  populateVehicleOptions();
  loadFastag();
});
