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

  demoFallbackLogin(email, password, requestedRole) {
    const role = requestedRole || 'USER';
    const names = {
      USER: 'Arun Kumar (Demo Commuter)',
      POLICE: 'Inspector Vikram Rathore',
      GOVERNMENT_STAFF: 'Dr. Shalini Venkat (Transport Commissioner)',
      ADMIN: 'System Super Administrator',
    };
    const mockUser = {
      id: 'demo_' + role.toLowerCase(),
      _id: 'demo_' + role.toLowerCase(),
      name: names[role] || 'Demo User',
      email: email || `${role.toLowerCase()}@drivelegal.demo`,
      role: role,
      driverScore: 92,
      officerId: role === 'POLICE' ? 'POLICE-TN-8492' : (role === 'GOVERNMENT_STAFF' ? 'GOV-TN-1029' : null),
      badgeNumber: role === 'POLICE' ? 'TN-TP-409' : (role === 'GOVERNMENT_STAFF' ? 'MORT-HQ-88' : null),
    };
    const mockToken = 'demo_jwt_token_' + btoa(JSON.stringify(mockUser));
    this.setToken(mockToken);
    this.setUser(mockUser);
    return {
      success: true,
      message: 'Authentication Successful (Demo Mode)',
      data: { token: mockToken, user: mockUser },
    };
  },

  demoFallbackRegister(payload) {
    const role = payload.role || 'USER';
    const mockUser = {
      id: 'user_' + Date.now().toString(16),
      _id: 'user_' + Date.now().toString(16),
      name: payload.name || 'Registered Commuter',
      email: payload.email,
      role: role,
      driverScore: 90,
      phone: payload.phone || '+91-9800000000',
    };
    const mockToken = 'demo_jwt_token_' + btoa(JSON.stringify(mockUser));
    this.setToken(mockToken);
    this.setUser(mockUser);
    return {
      success: true,
      message: 'Account registered successfully (Demo Mode)',
      data: { token: mockToken, user: mockUser },
    };
  },

  async login(email, password, requestedRole) {
    try {
      const res = await API.post('/auth/login', {
        email,
        password,
        requestedRole,
      });

      if (res && res.success && res.data) {
        this.setToken(res.data.token);
        this.setUser(res.data.user);
        return res;
      }

      // If backend reports buffering timeout or network unreachable, seamlessly fall back!
      if (!res.success && (res.message?.includes('timed out') || res.message?.includes('buffering') || res.message?.includes('Network error') || res.message?.includes('unreachable'))) {
        console.warn('[Auth] Serverless/offline timeout detected, activating instant demo session.');
        return this.demoFallbackLogin(email, password, requestedRole);
      }
      return res;
    } catch (e) {
      console.warn('[Auth] Exception during login, activating instant demo session:', e);
      return this.demoFallbackLogin(email, password, requestedRole);
    }
  },

  async register(payload) {
    try {
      const res = await API.post('/auth/register', payload);
      if (res && res.success && res.data) {
        this.setToken(res.data.token);
        this.setUser(res.data.user);
        return res;
      }

      if (!res.success && (res.message?.includes('timed out') || res.message?.includes('buffering') || res.message?.includes('Network error') || res.message?.includes('unreachable'))) {
        console.warn('[Auth] Serverless/offline timeout detected during register, activating instant demo session.');
        return this.demoFallbackRegister(payload);
      }
      return res;
    } catch (e) {
      return this.demoFallbackRegister(payload);
    }
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

    const target = accounts[role] || accounts.USER;
    if (emailField) emailField.value = target.email;
    if (passwordField) passwordField.value = target.pass;
  },
};

window.Auth = Auth;
