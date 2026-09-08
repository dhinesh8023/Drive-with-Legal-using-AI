async function loadNotifications() {
  const list = document.getElementById("notificationsList");
  try {
    const { notifications } = await api.get("/notifications");
    if (!notifications.length) {
      list.innerHTML = `<div class="empty-state">No notifications yet.</div>`;
      return;
    }
    list.innerHTML = notifications
      .map((n) => {
        const channelIcon = { IN_APP: "bi-app-indicator", SMS: "bi-chat-dots", WHATSAPP: "bi-whatsapp", EMAIL: "bi-envelope" }[n.channel];
        return `<div class="glass-card ${n.isRead ? "" : "accented"}" style="margin-bottom:10px; cursor:pointer;" onclick="markRead('${n._id}', this)">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-8">
              <i class="bi ${channelIcon}"></i>
              <strong style="font-size:13px;">${n.subject || "Notification"}</strong>
              ${n.isDemo ? '<span class="pill pill-review">DEMO</span>' : ""}
            </div>
            <span class="text-muted" style="font-size:11px;">${new Date(n.createdAt).toLocaleString()}</span>
          </div>
          <p class="text-secondary" style="white-space:pre-line; font-size:13px; margin:8px 0 0;">${n.message}</p>
        </div>`;
      })
      .join("");
  } catch (err) {
    list.innerHTML = `<div class="empty-state">${err.message}</div>`;
  }
}

async function markRead(id, el) {
  try {
    await api.post(`/notifications/${id}/read`);
    el.classList.remove("accented");
  } catch (err) {
    /* non-fatal */
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const user = renderShell("notifications", "Notifications");
  if (!user) return;
  loadNotifications();
});
