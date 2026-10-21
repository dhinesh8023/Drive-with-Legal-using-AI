/**
 * DRIVE LEGAL AI — FRONTEND CONFIGURATION
 * Autonomous Predictive Road Safety Platform
 * Final Year Engineering Project (B.E. / B.Tech)
 */
const isLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';

const CONFIG = {
  API_BASE_URL: isLocal && window.location.port !== '5000' && window.location.port !== ''
    ? 'http://127.0.0.1:5000/api'
    : (isLocal && window.location.port === '5000' ? '/api' : '/api'),
  SOCKET_URL: isLocal ? 'http://127.0.0.1:5000' : window.location.origin,
  AI_MICROSERVICE_URL: isLocal ? 'http://127.0.0.1:8000' : '/api/ai',
  ENV: isLocal ? 'development' : 'production',
  IS_DEMO_MODE: true,

  // Role default landing routes
  ROLE_REDIRECTS: {
    USER: 'dashboard.html',
    POLICE: 'police-dashboard.html',
    GOVERNMENT_STAFF: 'government-dashboard.html',
    ADMIN: 'admin-dashboard.html',
  },

  // Speech Alert Voice Configurations
  VOICE: {
    DEFAULT_LANG: 'en-US',
    TAMIL_LANG: 'ta-IN',
    VOLUME: 1.0,
    RATE: 1.0,
  },
};

window.CONFIG = CONFIG;
