/**
 * Thin fetch wrapper around the backend API. Attaches the JWT automatically,
 * normalizes error handling, and redirects to login on 401s.
 */
const api = {
  async request(method, path, body, opts = {}) {
    const token = localStorage.getItem(CONFIG.TOKEN_KEY);
    const headers = { "Content-Type": "application/json" };
    if (token && !opts.skipAuth) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${CONFIG.API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = { success: false, message: "Invalid server response." };
    }

    if (res.status === 401 && !opts.skipAuth) {
      localStorage.removeItem(CONFIG.TOKEN_KEY);
      localStorage.removeItem(CONFIG.USER_KEY);
      if (!location.pathname.endsWith("login.html")) {
        window.location.href = "login.html";
      }
    }

    if (!data.success) {
      throw new Error(data.message || "Request failed.");
    }

    return data.data;
  },

  get(path, opts) { return this.request("GET", path, null, opts); },
  post(path, body, opts) { return this.request("POST", path, body, opts); },
  put(path, body, opts) { return this.request("PUT", path, body, opts); },
  delete(path, opts) { return this.request("DELETE", path, null, opts); },
};

/** Direct calls to the AI service (used by live-drive.html for low-latency scenario updates). */
const aiApi = {
  async predictRisk(payload) {
    const res = await fetch(`${CONFIG.AI_SERVICE_URL}/predict-risk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async analyze(payload) {
    const res = await fetch(`${CONFIG.AI_SERVICE_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};
