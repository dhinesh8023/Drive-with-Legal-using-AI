/**
 * Shared utility functions used across pages: toasts, formatting, modals.
 */

function showToast(message, type = "info") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function formatCurrency(amount) {
  return "\u20b9" + Number(amount || 0).toLocaleString("en-IN");
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function riskBadgeHtml(level) {
  return `<span class="risk-badge risk-${level}">${level}</span>`;
}

function statusPillHtml(status) {
  const map = {
    PENDING: "pill-pending", PAID: "pill-paid", OVERDUE: "pill-overdue",
    DISPUTED: "pill-overdue", UNDER_REVIEW: "pill-review", CANCELLED: "pill-rejected",
    APPROVED: "pill-approved", REJECTED: "pill-rejected", PENDING_REVIEW: "pill-pending",
    SUCCESS: "pill-success", FAILED: "pill-failed", PROCESSING: "pill-review",
  };
  const cls = map[status] || "pill-pending";
  return `<span class="pill ${cls}">${(status || "").replace(/_/g, " ")}</span>`;
}

function toggleSidebar() {
  document.querySelector(".sidebar")?.classList.toggle("open");
}

function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
