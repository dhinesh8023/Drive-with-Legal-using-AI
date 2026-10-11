/**
 * DRIVE LEGAL AI — AUTHENTICATION & ACCESS CONTROL (AUTH.JS)
 */

const Auth = {
  getUser() {
    try {
      const u = localStorage.getItem('dl_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  setUser(user) {
    localStorage.setItem('dl_user', JSON.stringify(user));
  },

  getToken() {
    return localStorage.getItem('dl_token');
  },

  setToken(token) {
    localStorage.setItem('dl_token', token);
  },

  isAuthenticated() {
    return !!this.getToken() && !!this.getUser();
  },

  async login(email, password, requestedRole) {
    const res = await API.post('/auth/login', {
      email,
      password,
      requestedRole,
    });

    if (res.success && res.data) {
      this.setToken(res.data.token);
      this.setUser(res.data.user);
      return res;
    }
    return res;
  },

  async register(payload) {
    const res = await API.post('/auth/register', payload);
    if (res.success && res.data) {
      this.setToken(res.data.token);
      this.setUser(res.data.user);
    }
    return res;
  },

  async logout() {
    try {
      await API.post('/auth/logout', {});
    } catch (e) {
      // Ignore network errors on logout
    }
    localStorage.removeItem('dl_token');
    localStorage.removeItem('dl_user');
    window.location.href = 'login.html';
  },

  /**
   * Enforce Role-Based Access Control on Protected Pages
   * @param {Array<string>} allowedRoles
   */
  requireAuth(allowedRoles = []) {
    if (!this.isAuthenticated()) {
      window.location.href = 'login.html';
      return false;
    }

    const user = this.getUser();
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      Utils.showToast('danger', 'Access Denied', `Role '${user.role}' cannot access this portal.`);
      // Redirect to permitted home
      const targetPage = CONFIG.ROLE_REDIRECTS[user.role] || 'dashboard.html';
      setTimeout(() => {
        window.location.href = targetPage;
      }, 1200);
      return false;
    }

    return true;
  },

  /**
   * Helper for quick seed account filling on login page
   */
  fillDemoCredentials(role) {
    const emailField = document.getElementById('login-email');
    const passwordField = document.getElementById('login-password');

    const accounts = {
      USER: { email: 'user@drivelegal.demo', pass: 'DemoPassword123!' },
      POLICE: { email: 'police@drivelegal.demo', pass: 'DemoPassword123!' },
      GOVERNMENT_STAFF: { email: 'gov@drivelegal.demo', pass: 'DemoPassword123!' },
      ADMIN: { email: 'admin@drivelegal.demo', pass: 'DemoPassword123!' },
    };

    const acc = accounts[role] || accounts.USER;
    if (emailField) emailField.value = acc.email;
    if (passwordField) passwordField.value = acc.pass;

    Utils.showToast('info', 'Credentials Auto-Filled', `Ready to test ${role} role.`);
  },
};

window.Auth = Auth;
