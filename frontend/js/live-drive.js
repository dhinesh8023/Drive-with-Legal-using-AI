/**
 * DRIVE LEGAL AI — LIVE AI DRIVE CONTROLLER (LIVE-DRIVE.JS)
 * Smart India Hackathon 2026
 */

let activeScenario = 'NORMAL DRIVING';
let liveSessionId = null;
let currentSpeed = 48;
let speedLimit = 60;
let animationFrameId = null;
let laneOffset = 0;
let isRealCameraRunning = false;
let selectedVoiceLang = 'en-US';

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth()) return;
  Utils.initNavigation();

  // Initialize Speech settings from storage
  selectedVoiceLang = localStorage.getItem('dl_voice_lang') || 'en-US';
  const langSelect = document.getElementById('voice-lang-select');
  if (langSelect) {
    langSelect.value = selectedVoiceLang;
    langSelect.addEventListener('change', (e) => {
      selectedVoiceLang = e.target.value;
      localStorage.setItem('dl_voice_lang', selectedVoiceLang);
      Utils.showToast('info', 'Voice Language', `Co-Driver language set to ${e.target.value === 'ta-IN' ? 'Tamil' : 'English'}`);
    });
  }

  // Setup Canvas Road Simulation
  initSimulatedRoadCanvas();

  // Initialize Driving Session on backend
  await startDrivingSession();

  // Bind Scenario Buttons
  bindScenarioButtons();

  // Bind Camera Action
  const camBtn = document.getElementById('toggle-camera-btn');
  if (camBtn) camBtn.addEventListener('click', toggleCameraFeed);

  // Bind Emergency Button
  const sosBtn = document.getElementById('emergency-sos-btn');
  if (sosBtn) sosBtn.addEventListener('click', triggerManualEmergencySOS);

  // Initialize first scenario
  setScenario('NORMAL DRIVING');
});

/**
 * Start backend driving session
 */
async function startDrivingSession() {
  const user = Auth.getUser();
  const res = await API.post('/driving/start', {
    vehicleNumber: 'TN09AB1234',
  });

  if (res.success && res.data) {
    liveSessionId = res.data.sessionId;
    const sessionBadge = document.getElementById('live-session-badge');
    if (sessionBadge) sessionBadge.textContent = liveSessionId;
  }
}

/**
 * Set and evaluate active scenario
 */
async function setScenario(scenarioName) {
  activeScenario = scenarioName;

  // Highlight active button
  document.querySelectorAll('.scenario-btn').forEach((btn) => {
    if (btn.dataset.scenario === scenarioName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Scenario specific telemetry updates
  let telemetry = {
    speed: 48,
    speedLimit: 60,
    driverAttention: 94,
    drowsiness: 5,
    distraction: 5,
    mobileUsage: false,
    weather: 'Clear',
    roadCondition: 'Good',
    followingDistance: 32,
    scenario: scenarioName,
  };

  let speechAlertEn = '';
  let speechAlertTa = '';

  switch (scenarioName) {
    case 'NORMAL DRIVING':
      currentSpeed = 48;
      telemetry.speed = 48;
      break;

    case 'OVERSPEEDING':
      currentSpeed = 92;
      telemetry.speed = 92;
      speechAlertEn = 'Warning. Reduce speed immediately. You are exceeding the speed limit.';
      speechAlertTa = 'எச்சரிக்கை. வேகத்தைக் குறைக்கவும். அனுமதிக்கப்பட்ட வேகத்தைத் தாண்டிவிட்டீர்கள்.';
      triggerViolationCandidate('Overspeeding', 92, 94);
      break;

    case 'DROWSINESS':
      currentSpeed = 45;
      telemetry.speed = 45;
      telemetry.drowsiness = 88;
      telemetry.driverAttention = 25;
      speechAlertEn = 'Driver drowsiness detected. Driver attention is critically low. Please take a break.';
      speechAlertTa = 'ஓட்டுநரின் கவனம் குறைவாக உள்ளது. தூக்கக் கலக்கம் கண்டறியப்பட்டது. சற்று ஓய்வெடுக்கவும்.';
      break;

    case 'DISTRACTION':
      telemetry.distraction = 75;
      telemetry.driverAttention = 45;
      speechAlertEn = 'Driver inattention detected. Keep your eyes on the road ahead.';
      speechAlertTa = 'ஓட்டுநரின் கவனம் சிதறியுள்ளது. சாலையை நேராகப் பார்க்கவும்.';
      break;

    case 'MOBILE PHONE USAGE':
      telemetry.mobileUsage = true;
      telemetry.distraction = 85;
      telemetry.driverAttention = 35;
      speechAlertEn = 'Active mobile phone usage detected while driving. Put down your device.';
      speechAlertTa = 'வாகனம் ஓட்டும்போது கைப்பேசி பயன்பாடு கண்டறியப்பட்டுள்ளது. கைப்பேசியை கீழே வைக்கவும்.';
      triggerViolationCandidate('Mobile Phone Usage', currentSpeed, 91);
      break;

    case 'POTHOLE':
      telemetry.roadCondition = 'Potholed';
      speechAlertEn = 'Caution. Deep pothole detected ahead. Decelerate smoothly.';
      speechAlertTa = 'முன்னால் ஆழமான பள்ளம் உள்ளது. வேகத்தைக் குறைக்கவும்.';
      break;

    case 'UNSAFE OVERTAKING':
      currentSpeed = 75;
      telemetry.speed = 75;
      speechAlertEn = 'Unsafe overtaking trajectory. Insufficient oncoming gap.';
      speechAlertTa = 'பாதுகாப்பற்ற முந்துதல். உடனடியாக முதன்மைப் பாதைக்குத் திரும்பவும்.';
      break;

    case 'WRONG SIDE DRIVING':
      telemetry.wrongSide = true;
      speechAlertEn = 'CRITICAL WARNING! Wrong side driving detected! Stop on the shoulder immediately.';
      speechAlertTa = 'ஆபத்து! தவறான திசையில் வாகனம் செல்கிறது! உடனடியாக சாலையோர நிறுத்தவும்.';
      triggerViolationCandidate('Wrong-Side Driving', currentSpeed, 98);
      break;

    case 'HEAVY RAIN':
      telemetry.weather = 'Heavy Rain';
      speechAlertEn = 'Heavy rain detected. Low friction surface. Recommended speed reduced to 40.';
      speechAlertTa = 'கனமழை பெய்கிறது. சறுக்கும் சாலை. பரிந்துரைக்கப்பட்ட வேகம் குறைக்கப்பட்டுள்ளது.';
      break;

    case 'LANE DEPARTURE':
      telemetry.laneDeparture = true;
      speechAlertEn = 'Warning. Unsignaled lane departure detected. Stay within lane markers.';
      speechAlertTa = 'எச்சரிக்கை. பாதை விலகல் கண்டறியப்பட்டுள்ளது.';
      break;

    case 'SUDDEN BRAKING':
      currentSpeed = 20;
      telemetry.speed = 20;
      telemetry.suddenBraking = true;
      speechAlertEn = 'High deceleration braking registered. Check rear mirror.';
      speechAlertTa = 'திடீர் பிரேக் கண்டறியப்பட்டது. பின்வரும் வாகனங்களைக் கவனிக்கவும்.';
      break;

    case 'COLLISION RISK':
      telemetry.followingDistance = 6;
      speechAlertEn = 'Collision risk detected ahead! Apply brakes immediately!';
      speechAlertTa = 'மோதல் அபாயம் கண்டறியப்பட்டுள்ளது! உடனடியாக பிரேக் அழுத்தவும்!';
      break;

    case 'ACCIDENT':
      currentSpeed = 0;
      telemetry.speed = 0;
      speechAlertEn = 'Severe collision event detected! Emergency SOS alert activated.';
      speechAlertTa = 'விபத்து நிகழ்வு கண்டறியப்பட்டுள்ளது! அவசர உதவி நெறிமுறை இயக்கப்பட்டது.';
      triggerManualEmergencySOS();
      break;
  }

  // Update UI Speedometer
  updateSpeedometer(currentSpeed, speedLimit);

  // Evaluate Risk Engine
  const evaluation = await ClientRiskEngine.calculateRisk(telemetry);
  ClientRiskEngine.updateVisuals(evaluation);

  // Voice Co-Driver synthesis
  if (speechAlertEn) {
    const alertToSpeak = selectedVoiceLang === 'ta-IN' ? speechAlertTa : speechAlertEn;
    Utils.speakVoice(alertToSpeak, selectedVoiceLang === 'ta-IN' ? 'ta' : 'en-US');
  }

  // Append Timeline Event
  appendTimelineItem(scenarioName, evaluation.riskScore, evaluation.riskLevel);

  // Sync to Backend Driving Session
  if (liveSessionId) {
    API.post('/driving/update', {
      sessionId: liveSessionId,
      scenario: scenarioName,
      telemetry,
    });
  }
}

/**
 * Automatically creates candidate in Violation model for Police Review workflow
 */
async function triggerViolationCandidate(violationType, speed, confidence) {
  try {
    const res = await API.post('/violations', {
      vehicleNumber: 'TN09AB1234',
      violationType,
      location: 'Outer Ring Road Expressway - KM 18',
      latitude: 12.9279,
      longitude: 77.6271,
      aiConfidence: confidence,
      riskScore: 82,
      detectionSource: 'In-Vehicle Live AI',
      aiAnalysisDetails: {
        speedRecorded: speed,
        speedLimit: 60,
        reasons: [`In-vehicle AI telematics detected candidate ${violationType}`],
      },
    });

    if (res.success) {
      Utils.showToast(
        'warning',
        'AI Violation Candidate Created',
        `${violationType} candidate forwarded to Police Portal for Officer Review.`
      );
    }
  } catch (err) {
    console.error('Candidate submission error:', err);
  }
}

/**
 * Bind scenario button clicks
 */
function bindScenarioButtons() {
  document.querySelectorAll('.scenario-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      setScenario(btn.dataset.scenario);
    });
  });
}

/**
 * Update HUD Speedometer numbers
 */
function updateSpeedometer(speed, limit) {
  const speedEl = document.getElementById('hud-speed-val');
  const limitEl = document.getElementById('hud-speed-limit');
  if (speedEl) speedEl.textContent = Math.round(speed);
  if (limitEl) limitEl.textContent = limit;
}

/**
 * Append event to session timeline
 */
function appendTimelineItem(scenario, score, level) {
  const container = document.getElementById('live-timeline-list');
  if (!container) return;

  const item = document.createElement('div');
  item.style.padding = '0.5rem 0.75rem';
  item.style.borderBottom = '1px solid rgba(255,255,255,0.06)';
  item.style.fontSize = '0.8rem';
  item.style.display = 'flex';
  item.style.alignItems = 'center';
  item.style.justifyContent = 'space-between';

  const timeStr = new Date().toLocaleTimeString();
  item.innerHTML = `
    <div>
      <span style="color:#00f0ff; font-weight:700;">[${timeStr}]</span>
      <span style="color:#fff; margin-left:6px;">${scenario}</span>
    </div>
    <div>${Utils.getRiskBadge(score)}</div>
  `;

  container.insertBefore(item, container.firstChild);

  // Keep max 15 items
  if (container.children.length > 15) {
    container.removeChild(container.lastChild);
  }
}

/**
 * Real Camera Toggle
 */
async function toggleCameraFeed() {
  const video = document.getElementById('camera-video');
  const canvas = document.getElementById('simulated-canvas');
  const btn = document.getElementById('toggle-camera-btn');

  if (!isRealCameraRunning) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      video.srcObject = stream;
      video.style.display = 'block';
      if (canvas) canvas.style.display = 'none';
      isRealCameraRunning = true;
      if (btn) btn.innerHTML = '<i class="bi bi-camera-video-off"></i> Switch to Simulated Feed';
      Utils.showToast('success', 'Camera Active', 'Live camera stream attached to AI vision HUD.');
    } catch (err) {
      Utils.showToast('danger', 'Camera Access', 'Could not open camera. Continuing in simulated vision mode.');
    }
  } else {
    if (video.srcObject) {
      video.srcObject.getTracks().forEach((t) => t.stop());
    }
    video.style.display = 'none';
    if (canvas) canvas.style.display = 'block';
    isRealCameraRunning = false;
    if (btn) btn.innerHTML = '<i class="bi bi-camera-video"></i> Connect Physical Camera';
  }
}

/**
 * Road Canvas Horizon Animation
 */
function initSimulatedRoadCanvas() {
  const canvas = document.getElementById('simulated-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function draw() {
    const w = canvas.width;
    const h = canvas.height;

    // Sky / Horizon gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.5);
    skyGrad.addColorStop(0, '#060a12');
    skyGrad.addColorStop(1, '#0e1726');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.5);

    // Road Ground
    const roadGrad = ctx.createLinearGradient(0, h * 0.5, 0, h);
    roadGrad.addColorStop(0, '#151d2c');
    roadGrad.addColorStop(1, '#090e17');
    ctx.fillStyle = roadGrad;
    ctx.fillRect(0, h * 0.5, w, h * 0.5);

    // Road Perspective Triangle
    ctx.beginPath();
    ctx.moveTo(w * 0.46, h * 0.5);
    ctx.lineTo(w * 0.54, h * 0.5);
    ctx.lineTo(w * 0.95, h);
    ctx.lineTo(w * 0.05, h);
    ctx.closePath();
    ctx.fillStyle = '#1e293b';
    ctx.fill();

    // Road border lines
    ctx.strokeStyle = '#00f0ff44';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Moving Lane Centerline
    laneOffset = (laneOffset + (currentSpeed * 0.12)) % 40;
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 20]);
    ctx.lineDashOffset = -laneOffset;

    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.5);
    ctx.lineTo(w * 0.5, h);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Draw Simulated Vehicle Ahead if scenario requires
    if (activeScenario === 'COLLISION RISK' || activeScenario === 'NORMAL DRIVING') {
      const vY = h * 0.62;
      const vW = w * 0.14;
      const vH = h * 0.12;
      const vX = (w * 0.5) - (vW / 2);

      // Car body
      ctx.fillStyle = '#334155';
      ctx.fillRect(vX, vY, vW, vH);
      // Taillights
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(vX + 4, vY + vH - 12, 14, 8);
      ctx.fillRect(vX + vW - 18, vY + vH - 12, 14, 8);

      // AI Bounding Box
      ctx.strokeStyle = activeScenario === 'COLLISION RISK' ? '#ef4444' : '#00f0ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(vX - 4, vY - 4, vW + 8, vH + 8);

      // Label
      ctx.fillStyle = activeScenario === 'COLLISION RISK' ? '#ef4444' : '#00f0ff';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(
        activeScenario === 'COLLISION RISK' ? 'CRITICAL PROXIMITY [6m]' : 'LEAD VEHICLE [32m]',
        vX - 4,
        vY - 10
      );
    }

    animationFrameId = requestAnimationFrame(draw);
  }

  draw();
}

/**
 * Trigger SOS Workflow
 */
async function triggerManualEmergencySOS() {
  const res = await API.post('/driving/emergency', {
    latitude: 12.9279,
    longitude: 77.6271,
    locationName: 'Outer Ring Road Expressway',
    crashGForce: 4.8,
  });

  if (res.success) {
    Utils.showToast(
      'danger',
      'EMERGENCY SOS DISPATCHED',
      'Automated prototype SOS alert sent to 108 Emergency and Highway Patrol Units.'
    );
  }
}
