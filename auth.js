/**
 * Authentication helpers: session storage, role guards, and page wiring
 * for login.html / register.html.
 */
const Auth = {
  getUser() {
    try { return JSON.parse(localStorage.getItem(CONFIG.USER_KEY)); } catch { return null; }
  },
  isLoggedIn() { return !!localStorage.getItem(CONFIG.TOKEN_KEY); },
  saveSession({ user, accessToken, refreshToken }) {
    localStorage.setItem(CONFIG.TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(CONFIG.REFRESH_KEY, refreshToken);
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.REFRESH_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
  },
  dashboardForRole(role) {
    return {
      USER: "dashboard.html",
      POLICE: "police-dashboard.html",
      GOVERNMENT_STAFF: "government-dashboard.html",
      ADMIN: "admin-dashboard.html",
    }[role] || "dashboard.html";
  },
  /** Call at the top of every protected page. Redirects if not logged in
   * or (when roles given) if the user's role isn't allowed on this page. */
  guard(allowedRoles) {
    if (!this.isLoggedIn()) {
      window.location.href = "login.html";
      return null;
    }
    const user = this.getUser();
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      window.location.href = this.dashboardForRole(user.role);
      return null;
    }
    return user;
  },
  async logout() {
    try { await api.post("/auth/logout"); } catch (e) { /* ignore */ }
    this.clearSession();
    window.location.href = "login.html";
  },
};

function initLoginPage() {
  const form = qs("#loginForm");
  if (!form) return;

  let selectedRole = "USER";
  qsa(".role-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      qsa(".role-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      selectedRole = tab.dataset.role;
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = qs("#email").value.trim();
    const password = qs("#password").value;
    const btn = qs("#loginBtn");
    btn.disabled = true;
    btn.textContent = "Signing in...";

    try {
      const data = await api.post("/auth/login", { email, password }, { skipAuth: true });
      if (data.user.role !== selectedRole) {
        showToast(`This account is registered as ${data.user.role.replace("_", " ")}, not ${selectedRole.replace("_", " ")}.`, "error");
        return;
      }
      Auth.saveSession(data);
      showToast("Login successful.", "success");
      setTimeout(() => (window.location.href = Auth.dashboardForRole(data.user.role)), 400);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Sign In";
    }
  });
}

function initRegisterPage() {
  const form = qs("#registerForm");
  if (!form) return;

  const staffFields = qs("#staffFields");
  const roleSelect = qs("#role");
  roleSelect?.addEventListener("change", () => {
    const isStaff = roleSelect.value === "POLICE" || roleSelect.value === "GOVERNMENT_STAFF";
    staffFields.style.display = isStaff ? "block" : "none";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      name: qs("#name").value.trim(),
      email: qs("#email").value.trim(),
      phone: qs("#phone").value.trim(),
      password: qs("#password").value,
      role: roleSelect?.value || "USER",
      officerId: qs("#officerId")?.value,
      organizationId: qs("#organizationId")?.value,
      registrationCode: qs("#registrationCode")?.value,
    };

    try {
      const data = await api.post("/auth/register", payload, { skipAuth: true });
      showToast(
        data.requiresApproval
          ? "Account created. Awaiting admin approval before you can log in."
          : "Account created successfully. You can now log in.",
        "success"
      );
      setTimeout(() => (window.location.href = "login.html"), 1200);
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initLoginPage();
  initRegisterPage();

  qs("#logoutBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    Auth.logout();
  });
});
