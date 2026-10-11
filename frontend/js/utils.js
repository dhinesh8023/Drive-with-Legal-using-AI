/**
 * DRIVE LEGAL AI — FRONTEND UTILITIES (UTILS.JS)
 */

const Utils = {
  /**
   * Display floating toast alert
   */
  showToast(type = 'info', title = '', message = '') {
    let container = document.getElementById('dl-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'dl-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'dl-toast';

    let icon = 'bi-info-circle-fill text-cyan';
    let borderColor = 'rgba(0, 240, 255, 0.4)';
    if (type === 'success') {
      icon = 'bi-check-circle-fill text-success';
      borderColor = 'rgba(16, 185, 129, 0.5)';
    } else if (type === 'danger' || type === 'error') {
      icon = 'bi-exclamation-octagon-fill text-danger';
      borderColor = 'rgba(239, 68, 68, 0.5)';
    } else if (type === 'warning') {
      icon = 'bi-exclamation-triangle-fill text-warning';
      borderColor = 'rgba(245, 158, 11, 0.5)';
    }

    toast.style.borderColor = borderColor;
    toast.innerHTML = `
      <i class="bi ${icon} fs-4"></i>
      <div style="flex: 1;">
        <div style="font-weight: 700; font-size: 0.9rem; color: #fff;">${title}</div>
        <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 2px;">${message}</div>
      </div>
      <button style="background:none; border:none; color:#64748b; cursor:pointer;" onclick="this.parentElement.remove()">
        <i class="bi bi-x-lg"></i>
      </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  },

  /**
   * Currency formatter (INR)
   */
  formatCurrency(num) {
    return '₹' + (Number(num) || 0).toLocaleString('en-IN');
  },

  /**
   * Date formatting
   */
  formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  },

  formatDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  /**
   * Risk Badge HTML Helper
   */
  getRiskBadge(score) {
    const s = Number(score) || 0;
    if (s >= 81) return `<span class="badge-risk critical"><i class="bi bi-shield-fill-x"></i> CRITICAL (${s})</span>`;
    if (s >= 61) return `<span class="badge-risk high"><i class="bi bi-exclamation-triangle-fill"></i> HIGH (${s})</span>`;
    if (s >= 31) return `<span class="badge-risk moderate"><i class="bi bi-exclamation-circle-fill"></i> MODERATE (${s})</span>`;
    return `<span class="badge-risk safe"><i class="bi bi-shield-fill-check"></i> SAFE (${s})</span>`;
  },

  /**
   * AI Voice Speech Synthesis
   */
  speakVoice(text, lang = 'en-US') {
    if (!('speechSynthesis' in window)) return;
    
    // Check if voice muted in settings
    const voiceEnabled = localStorage.getItem('dl_voice_enabled') !== 'false';
    if (!voiceEnabled) return;

    window.speechSynthesis.cancel(); // Cancel active speech to avoid lag
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = parseFloat(localStorage.getItem('dl_voice_volume') || '1.0');
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-US';

    window.speechSynthesis.speak(utterance);
  },

  /**
   * Initialize common UI elements (Sidebar, User Badge, Mobile drawer)
   */
  initNavigation() {
    const user = Auth.getUser();
    if (!user) return;

    // Populate user profile info in sidebar
    const nameEl = document.getElementById('sidebar-user-name');
    const roleEl = document.getElementById('sidebar-user-role');
    const avatarEl = document.getElementById('sidebar-user-avatar');

    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role.replace('_', ' ');
    if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();

    // Setup mobile drawer toggle
    const toggleBtn = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.app-sidebar');
    if (toggleBtn && sidebar) {
      let backdrop = document.querySelector('.sidebar-backdrop');
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';
        document.body.appendChild(backdrop);
      }

      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('show-mobile');
        backdrop.classList.toggle('active');
      });

      backdrop.addEventListener('click', () => {
        sidebar.classList.remove('show-mobile');
        backdrop.classList.remove('active');
      });
    }
  },
};

window.Utils = Utils;
