/**
 * Renders the shared sidebar + topbar shell into #appShell, then moves
 * the page's own <main id="pageContent"> content into the shell's body.
 * Call renderShell(activeKey, pageTitle) at the top of each dashboard page.
 */

const NAV_ITEMS = {
  USER: [
    { key: "dashboard", label: "Dashboard", icon: "bi-speedometer2", href: "dashboard.html" },
    { key: "live-drive", label: "Live AI Drive", icon: "bi-camera-video", href: "live-drive.html" },
    { key: "vehicles", label: "My Vehicles", icon: "bi-car-front", href: "vehicles.html" },
    { key: "violations", label: "Violations", icon: "bi-exclamation-triangle", href: "violations.html" },
    { key: "fine-management", label: "My Fines", icon: "bi-receipt", href: "fine-management.html" },
    { key: "payments", label: "Payments", icon: "bi-credit-card", href: "payments.html" },
    { key: "fastag", label: "FASTag", icon: "bi-tag", href: "fastag.html" },
    { key: "disputes", label: "Disputes", icon: "bi-chat-left-text", href: "disputes.html" },
    { key: "notifications", label: "Notifications", icon: "bi-bell", href: "notifications.html" },
    { key: "hazards", label: "Report Hazard", icon: "bi-cone-striped", href: "hazards.html" },
    { key: "road-map", label: "Road Safety Map", icon: "bi-map", href: "road-map.html" },
    { key: "route-planner", label: "Route Planner", icon: "bi-signpost-split", href: "route-planner.html" },
    { key: "emergency", label: "Emergency", icon: "bi-life-preserver", href: "emergency.html" },
    { key: "settings", label: "Settings", icon: "bi-gear", href: "settings.html" },
  ],
  POLICE: [
    { key: "police-dashboard", label: "Dashboard", icon: "bi-speedometer2", href: "police-dashboard.html" },
    { key: "violations", label: "Review Violations", icon: "bi-exclamation-triangle", href: "violations.html" },
    { key: "fine-management", label: "Fine Management", icon: "bi-receipt", href: "fine-management.html" },
    { key: "disputes", label: "Disputes", icon: "bi-chat-left-text", href: "disputes.html" },
    { key: "road-map", label: "Road Safety Map", icon: "bi-map", href: "road-map.html" },
    { key: "blackspots", label: "Blackspots", icon: "bi-radioactive", href: "blackspots.html" },
    { key: "settings", label: "Settings", icon: "bi-gear", href: "settings.html" },
  ],
  GOVERNMENT_STAFF: [
    { key: "government-dashboard", label: "Dashboard", icon: "bi-speedometer2", href: "government-dashboard.html" },
    { key: "analytics", label: "Analytics", icon: "bi-bar-chart", href: "analytics.html" },
    { key: "blackspots", label: "Blackspots", icon: "bi-radioactive", href: "blackspots.html" },
    { key: "road-map", label: "Road Safety Map", icon: "bi-map", href: "road-map.html" },
    { key: "fleet", label: "Fleet", icon: "bi-truck", href: "fleet.html" },
    { key: "settings", label: "Settings", icon: "bi-gear", href: "settings.html" },
  ],
  ADMIN: [
    { key: "admin-dashboard", label: "Dashboard", icon: "bi-speedometer2", href: "admin-dashboard.html" },
    { key: "fine-management", label: "Fine Rules", icon: "bi-receipt", href: "fine-management.html" },
    { key: "analytics", label: "Analytics", icon: "bi-bar-chart", href: "analytics.html" },
    { key: "settings", label: "Settings", icon: "bi-gear", href: "settings.html" },
  ],
};

function renderShell(activeKey, pageTitle) {
  const user = Auth.guard();
  if (!user) return null;

  const items = NAV_ITEMS[user.role] || NAV_ITEMS.USER;
  const navHtml = items
    .map(
      (item) => `<a class="nav-link ${item.key === activeKey ? "active" : ""}" href="${item.href}">
        <i class="bi ${item.icon}"></i> ${item.label}
      </a>`
    )
    .join("");

  const shell = document.getElementById("appShell");
  shell.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="logo-dot"></div>
          <div>
            <h1>DRIVE LEGAL AI</h1>
            <span>Road Safety Command</span>
          </div>
        </div>
        <nav>${navHtml}</nav>
        <div class="nav-section-label">Account</div>
        <a class="nav-link" href="#" id="logoutBtn"><i class="bi bi-box-arrow-right"></i> Logout</a>
      </aside>
      <div class="main-content">
        <div class="topbar">
          <div class="flex items-center gap-12">
            <button class="mobile-menu-btn" onclick="toggleSidebar()"><i class="bi bi-list"></i></button>
            <div class="topbar-title">${pageTitle}</div>
          </div>
          <div class="topbar-actions">
            <span class="text-secondary" style="font-size:13px;">${user.name} · <span class="text-muted">${user.role.replace("_", " ")}</span></span>
          </div>
        </div>
        <div class="page-body" id="pageBody"></div>
      </div>
    </div>
  `;

  const content = document.getElementById("pageContent");
  if (content) {
    document.getElementById("pageBody").appendChild(content);
    content.style.display = "block";
  }

  document.getElementById("logoutBtn").addEventListener("click", (e) => {
    e.preventDefault();
    Auth.logout();
  });

  return user;
}
