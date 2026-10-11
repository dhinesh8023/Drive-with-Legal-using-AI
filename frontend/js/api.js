/**
 * DRIVE LEGAL AI — HTTP API CLIENT (API.JS)
 */

const API = {
  getToken() {
    return localStorage.getItem('dl_token');
  },

  async request(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized token expiry
      if (response.status === 401) {
        if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('index.html')) {
          localStorage.removeItem('dl_token');
          localStorage.removeItem('dl_user');
          window.location.href = 'login.html';
        }
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`[API Network Error] ${endpoint}:`, error);
      return {
        success: false,
        message: 'Network error or backend server unreachable. Ensure backend is running on port 5000.',
        error: error.message,
      };
    }
  },

  get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request(url, { method: 'GET' });
  },

  post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};

window.API = API;
