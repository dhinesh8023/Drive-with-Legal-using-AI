/**
 * DRIVE LEGAL AI — NOTIFICATION INBOX (NOTIFICATIONS.JS)
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth()) return;
  Utils.initNavigation();

  await loadNotificationsList();
});

async function loadNotificationsList() {
  const res = await API.get('/notifications');
  const container = document.getElementById('notifications-list-container');
  if (!container) return;

  if (!res.success || !res.data || res.data.length === 0) {
    container.innerHTML = `<div class="glass-card text-center text-muted py-5">No notifications in your inbox.</div>`;
    return;
  }

  container.innerHTML = res.data
    .map(
      (n) => `
    <div class="glass-card mb-3 p-3 ${!n.isRead ? 'border-primary' : ''}">
      <div class="d-flex align-items-start justify-content-between gap-3">
        <div class="d-flex align-items-start gap-3">
          <div class="metric-icon-box ${n.reminderLevel >= 3 ? 'red' : n.reminderLevel === 2 ? 'orange' : 'cyan'}" style="width:40px; height:40px; font-size:1.1rem;">
            <i class="bi ${n.channel.includes('SMS') ? 'bi-chat-dots-fill' : n.channel.includes('WHATSAPP') ? 'bi-whatsapp' : 'bi-bell-fill'}"></i>
          </div>
          <div>
            <h6 class="mb-1 text-white">${n.title}</h6>
            <p class="text-muted small mb-2">${n.message}</p>
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-secondary" style="font-size: 0.65rem;">Channel: ${n.channel.replace('_SIMULATION', ' (Demo)')}</span>
              <span class="badge bg-dark border border-secondary" style="font-size: 0.65rem;">Level ${n.reminderLevel}</span>
              <small class="text-dim" style="font-size: 0.72rem;">${Utils.formatDateTime(n.sentAt)}</small>
            </div>
          </div>
        </div>
        ${
          !n.isRead
            ? `<button class="btn-dl btn-dl-outline" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;" onclick="markNotificationRead('${n._id}')">Mark Read</button>`
            : '<span class="text-muted small">Read</span>'
        }
      </div>
    </div>
  `
    )
    .join('');
}

window.markNotificationRead = async function (id) {
  await API.post(`/notifications/${id}/read`, {});
  await loadNotificationsList();
};
