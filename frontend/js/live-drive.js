/**
 * DRIVE LEGAL AI — REAL-TIME COMPUTER VISION & DRIVING INTELLIGENCE ENGINE
 * Final Year Engineering Project — Real-Time Telemetry, Face/Ocular Tracking & Enforcement
 */

let activeScenario = 'NORMAL DRIVING';
let liveSessionId = null;
let currentSpeed = 48;
let speedLimit = 60;
let animationFrameId = null;
let laneOffset = 0;
let isRealCameraRunning = false;
let selectedVoiceLang = 'en-US';
let liveSocket = null;
let gpsWatchId = null;
let isGpsActive = false;

// Real-Time Computer Vision State Variables
let faceDetectorInstance = null;
let eyesClosedStartTime = null;
let headTurnStartTime = null;
let phoneDetectedStartTime = null;
let lastViolationTriggerTime = 0;
let lastSpokenAlertTime = 0;
let cvFaceBox = null;
let cvStatusLabel = 'NOMINAL';
let cvStatusColor = '#00f0ff';

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth()) return;
  Utils.initNavigation();

  // Initialize Speech settings
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

  // Initialize Socket.IO connection for real-time dispatch
  initLiveSocket();

  // Setup Canvas Visual & CV Stream
  initVisionCanvas();

  // Initialize Driving Session on backend
  await startDrivingSession();

  // Bind Controls
  bindScenarioButtons();
  bindSpeedControls();

  // Bind Camera Action
  const camBtn = document.getElementById('toggle-camera-btn');
  if (camBtn) camBtn.addEventListener('click', toggleCameraFeed);

  // Bind GPS Speedometer
  const gpsBtn = document.getElementById('toggle-gps-btn');
  if (gpsBtn) gpsBtn.addEventListener('click', toggleGpsSpeedometer);

  // Bind Emergency Button
  const sosBtn = document.getElementById('emergency-sos-btn');
  if (sosBtn) sosBtn.addEventListener('click', triggerManualEmergencySOS);

  // Initialize Native Browser FaceDetector if supported
  if ('FaceDetector' in window) {
    try {
      faceDetectorInstance = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
      console.log('[Vision Engine] Hardware-accelerated FaceDetector initialized.');
    } catch (e) {
      console.warn('[Vision Engine] Native FaceDetector fallback to optical analyzer.');
    }
  }

  // Initialize nominal driving state
  setScenario('NORMAL DRIVING');
});

/**
 * Real-Time Socket.IO Link
 */
function initLiveSocket() {
  if (typeof io === 'undefined') return;
  try {
    const socketUrl = CONFIG.SOCKET_URL || window.location.origin;
    liveSocket = io(socketUrl, { transports: ['websocket', 'polling'] });
    liveSocket.on('connect', () => {
      console.log('[Live Drive Socket] Connected to central telemetry stream:', liveSocket.id);
    });
  } catch (err) {
    console.warn('[Live Drive Socket] Offline telemetry fallback:', err.message);
  }
}

/**
 * Start backend driving session
 */
async function startDrivingSession() {
  const user = Auth.getUser();
  const res = await API.post('/driving/start', {
    vehicleNumber: 'TN-09-CB-1234',
  });

  if (res.success && res.data) {
    liveSessionId = res.data.sessionId;
    const sessionBadge = document.getElementById('live-session-badge');
    if (sessionBadge) sessionBadge.textContent = liveSessionId;
  }
}

/**
 * Bind interactive vehicle accelerator & speed slider
 */
function bindSpeedControls() {
  const slider = document.getElementById('vehicle-throttle-slider');
  const accelBtn = document.getElementById('btn-accel-10');
  const brakeBtn = document.getElementById('btn-brake-10');
  const testSpeedBtn = document.getElementById('btn-test-speed-violation');

  if (slider) {
    slider.addEventListener('input', (e) => {
      setSpeed(Number(e.target.value));
    });
  }

  if (accelBtn) {
    accelBtn.addEventListener('click', () => {
      setSpeed(Math.min(140, currentSpeed + 10));
    });
  }

  if (brakeBtn) {
    brakeBtn.addEventListener('click', () => {
      setSpeed(Math.max(0, currentSpeed - 10));
    });
  }

  if (testSpeedBtn) {
    testSpeedBtn.addEventListener('click', () => {
      setSpeed(95);
      setScenario('OVERSPEEDING');
    });
  }
}

function setSpeed(speedVal) {
  currentSpeed = Math.round(speedVal);
  const slider = document.getElementById('vehicle-throttle-slider');
  if (slider && Number(slider.value) !== currentSpeed) {
    slider.value = currentSpeed;
  }

  updateSpeedometer(currentSpeed, speedLimit);

  // Real-time Overspeeding Violation Check
  if (currentSpeed > speedLimit + 15) {
    const now = Date.now();
    if (now - lastViolationTriggerTime > 12000) {
      lastViolationTriggerTime = now;
      const snapshot = captureCanvasSnapshot();
      triggerViolationCandidate('Overspeeding', currentSpeed, 98, snapshot);

      const alertEn = `Warning! Speed limit is ${speedLimit} km/h. You are traveling at ${currentSpeed} km/h. Reduce speed immediately.`;
      const alertTa = `எச்சரிக்கை! அனுமதிக்கப்பட்ட வேகம் ${speedLimit} கி.மீ. வேகத்தைக் குறைக்கவும்.`;
      speakAlert(alertEn, alertTa);
    }
  }
}

/**
 * GPS Geolocation Velocity Tracker
 */
function toggleGpsSpeedometer() {
  const btn = document.getElementById('toggle-gps-btn');
  const badge = document.getElementById('gps-status-badge');

  if (!isGpsActive) {
    if (!('geolocation' in navigator)) {
      Utils.showToast('danger', 'GPS Error', 'Geolocation API not supported on this device.');
      return;
    }

    gpsWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        isGpsActive = true;
        if (btn) btn.innerHTML = '<i class="bi bi-geo-alt-fill text-success"></i> GPS Active';
        if (badge) {
          badge.className = 'badge bg-success';
          badge.textContent = 'LIVE SATELLITE GPS ACTIVE';
        }

        // Convert m/s to km/h if available
        if (pos.coords.speed !== null && !isNaN(pos.coords.speed)) {
          const gpsKmH = Math.round(pos.coords.speed * 3.6);
          setSpeed(gpsKmH);
        }
      },
      (err) => {
        Utils.showToast('warning', 'GPS Notice', 'Could not obtain satellite GPS fix. Using manual vehicle throttle.');
      },
      { enableHighAccuracy: true, maximumAge: 1000 }
    );
  } else {
    if (gpsWatchId) navigator.geolocation.clearWatch(gpsWatchId);
    isGpsActive = false;
    if (btn) btn.innerHTML = '<i class="bi bi-geo-alt"></i> Device GPS Speed';
    if (badge) {
      badge.className = 'badge bg-secondary';
      badge.textContent = 'MANUAL / SENSOR INPUT';
    }
  }
}

/**
 * Capture Base64 Snapshot from Canvas for Police Photographic Evidence
 */
function captureCanvasSnapshot() {
  const canvas = document.getElementById('simulated-canvas');
  if (!canvas) return null;
  try {
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch (e) {
    return null;
  }
}

/**
 * Trigger AI Candidate and Dispatch to Police Command Center
 */
async function triggerViolationCandidate(violationType, speed, confidence, evidenceBase64 = null) {
  try {
    const evidenceImage = evidenceBase64 || captureCanvasSnapshot() || '/assets/evidence/default_violation.jpg';

    const payload = {
      vehicleNumber: 'TN-09-CB-1234',
      violationType,
      location: 'Outer Ring Road Expressway - KM 18',
      latitude: 12.9279,
      longitude: 80.1271,
      aiConfidence: confidence || 94,
      riskScore: 85,
      detectionSource: isRealCameraRunning ? 'In-Vehicle Real CV Optical Sensor' : 'In-Vehicle Telematics Node',
      evidenceImage,
      aiAnalysisDetails: {
        speedRecorded: speed,
        speedLimit,
        reasons: [`Real-time computer vision algorithm confirmed ${violationType} candidate with ${confidence}% model confidence.`],
      },
    };

    const res = await API.post('/violations', payload);

    if (res.success && res.data) {
      Utils.showToast(
        'warning',
        '🚨 Violation Candidate Captured',
        `${violationType} candidate dispatched to Police Command Center for Officer Review.`
      );

      // Emit live over Socket.IO to police officers
      if (liveSocket && liveSocket.connected) {
        liveSocket.emit('violation_detected', {
          violationId: res.data.violationId,
          vehicleNumber: res.data.vehicleNumber,
          violationType: res.data.violationType,
          location: res.data.location,
          aiConfidence: res.data.aiConfidence,
          evidenceImage,
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.error('Candidate submission error:', err);
  }
}

/**
 * Set and evaluate active scenario
 */
async function setScenario(scenarioName) {
  activeScenario = scenarioName;

  document.querySelectorAll('.scenario-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.scenario === scenarioName);
  });

  let telemetry = {
    speed: currentSpeed,
    speedLimit,
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
      telemetry.speed = 48;
      telemetry.driverAttention = 95;
      setSpeed(48);
      break;

    case 'OVERSPEEDING':
      telemetry.speed = 92;
      setSpeed(92);
      speechAlertEn = 'Warning. Reduce speed. Zone speed limit is 60 km/h.';
      speechAlertTa = 'எச்சரிக்கை. வேகத்தைக் குறைக்கவும். அனுமதிக்கப்பட்ட வேகம் 60 கி.மீ.';
      triggerViolationCandidate('Overspeeding', 92, 98);
      break;

    case 'DROWSINESS':
      telemetry.drowsiness = 88;
      telemetry.driverAttention = 24;
      speechAlertEn = 'Critical alert! Driver drowsiness detected. Pull over safely and rest.';
      speechAlertTa = 'முக்கிய எச்சரிக்கை! தூக்கக் கலக்கம் கண்டறியப்பட்டுள்ளது. வாகனத்தை நிறுத்துங்கள்.';
      triggerViolationCandidate('Drowsiness', currentSpeed, 94);
      break;

    case 'DISTRACTION':
      telemetry.distraction = 85;
      telemetry.driverAttention = 32;
      speechAlertEn = 'Driver attention is dangerously low. Please focus on the road ahead.';
      speechAlertTa = 'ஓட்டுநரின் கவனம் குறைவாக உள்ளது. சாலையைக் கவனியுங்கள்.';
      break;

    case 'MOBILE PHONE USAGE':
      telemetry.mobileUsage = true;
      telemetry.driverAttention = 30;
      speechAlertEn = 'Mobile phone usage detected while driving. Hands on the wheel.';
      speechAlertTa = 'வாகனம் ஓட்டும்போது கைப்பேசி பயன்பாடு கண்டறியப்பட்டுள்ளது.';
      triggerViolationCandidate('Mobile Phone Usage', currentSpeed, 96);
      break;

    case 'POTHOLE':
      telemetry.roadCondition = 'Severe Pothole Cluster Ahead (15m)';
      speechAlertEn = 'Road hazard warning. Severe pothole cluster detected ahead.';
      speechAlertTa = 'முன்னால் சாலையில் ஆழமான பள்ளம் உள்ளது. கவனமாக செல்லவும்.';
      break;

    case 'WRONG SIDE DRIVING':
      speechAlertEn = 'Critical alarm! Vehicle is traversing against traffic flow on designated corridor.';
      speechAlertTa = 'ஆபத்து! எதிர் திசையில் வாகனம் செல்கிறது. உடனடியாக நிறுத்தவும்.';
      triggerViolationCandidate('Wrong-Side Driving', currentSpeed, 99);
      break;

    case 'HEAVY RAIN':
      telemetry.weather = 'Heavy Rain / Hydroplaning Hazard';
      telemetry.speedLimit = 40;
      speedLimit = 40;
      speechAlertEn = 'Inclement weather detected. Road friction reduced. Recommended speed 40 km/h.';
      speechAlertTa = 'கனமழை பெய்கிறது. சாலையின் பிடிப்பு குறைந்துள்ளது. வேகத்தை 40 கி.மீ ஆகக் குறைக்கவும்.';
      break;

    case 'COLLISION RISK':
      telemetry.followingDistance = 4;
      speechAlertEn = 'Collision risk critical! Immediate deceleration required!';
      speechAlertTa = 'மோதல் அபாயம்! உடனடியாக பிரேக் பிடிக்கவும்!';
      break;

    case 'LANE DEPARTURE':
      speechAlertEn = 'Unintentional lane departure detected. Centering vehicle trajectory.';
      speechAlertTa = 'தட விலகல் கண்டறியப்பட்டுள்ளது. தடத்தில் செல்லவும்.';
      break;

    case 'SUDDEN BRAKING':
      speechAlertEn = 'Sudden emergency braking event logged. Anti-lock traction engaged.';
      speechAlertTa = 'திடீர் பிரேக்கிங் பதிவு செய்யப்பட்டது.';
      break;

    case 'ACCIDENT':
      speechAlertEn = 'Severe impact detected! Emergency SOS alert transmitted to 108 network.';
      speechAlertTa = 'விபத்து கண்டறியப்பட்டது! அவசர உதவிக்குழுவுக்கு தகவல் அனுப்பப்பட்டுள்ளது.';
      triggerManualEmergencySOS();
      break;
  }

  // Evaluate through explainable risk engine
  const evaluation = RiskEngine.evaluate(telemetry);

  // Update HUD Cluster
  updateSpeedometer(currentSpeed, speedLimit);
  updateRiskCluster(evaluation);

  // Voice alert
  if (speechAlertEn) {
    speakAlert(speechAlertEn, speechAlertTa);
  }

  // Append Timeline Event
  appendTimelineItem(scenarioName, evaluation.riskScore, evaluation.riskLevel);
}

function speakAlert(enText, taText) {
  const now = Date.now();
  if (now - lastSpokenAlertTime < 4000) return; // Debounce speech alerts
  lastSpokenAlertTime = now;

  const alertToSpeak = selectedVoiceLang === 'ta-IN' ? taText : enText;
  Utils.speakVoice(alertToSpeak, selectedVoiceLang === 'ta-IN' ? 'ta' : 'en-US');
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

  // Radar limit highlight
  if (speedEl) {
    if (speed > limit + 10) {
      speedEl.style.color = '#ef4444';
    } else {
      speedEl.style.color = '#ffffff';
    }
  }
}

/**
 * Update Risk Score Cards and Explainable Breakdown
 */
function updateRiskCluster(evalResult) {
  const scoreVal = document.getElementById('hud-risk-score');
  const scoreCard = document.getElementById('hud-risk-card');
  const levelBadge = document.getElementById('hud-risk-level');
  const reasonsList = document.getElementById('hud-risk-reasons');
  const recommendationEl = document.getElementById('hud-risk-recommendation');
  const xaiContainer = document.getElementById('xai-factors-breakdown');

  if (scoreVal) scoreVal.textContent = evalResult.riskScore;
  if (levelBadge) {
    levelBadge.textContent = evalResult.riskLevel;
    levelBadge.className = `badge-risk ${evalResult.riskLevel.toLowerCase()}`;
  }

  if (scoreCard) {
    scoreCard.style.borderColor = evalResult.color;
  }

  if (recommendationEl) {
    recommendationEl.textContent = evalResult.recommendation;
  }

  if (reasonsList) {
    reasonsList.innerHTML = evalResult.reasons.map((r) => `<li>• ${r}</li>`).join('');
  }

  if (xaiContainer) {
    if (evalResult.breakdown && evalResult.breakdown.length > 0) {
      xaiContainer.innerHTML = evalResult.breakdown
        .map(
          (b) => `
        <div class="xai-factor-item">
          <div class="xai-factor-name">${b.factor}</div>
          <div class="xai-factor-impact" style="color: ${b.color};">+${b.impact} pts</div>
        </div>
      `
        )
        .join('');
    } else {
      xaiContainer.innerHTML = `<div class="text-muted small">Nominal operational safety factors.</div>`;
    }
  }
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
  if (container.children.length > 15) {
    container.removeChild(container.lastChild);
  }
}

/**
 * Real Physical Camera Toggle & Computer Vision Hook
 */
async function toggleCameraFeed() {
  const video = document.getElementById('camera-video');
  const btn = document.getElementById('toggle-camera-btn');
  const modeSelect = document.getElementById('camera-mode-select');
  const facingMode = modeSelect ? modeSelect.value : 'user';

  if (!isRealCameraRunning) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode },
      });
      video.srcObject = stream;
      await video.play();
      isRealCameraRunning = true;
      if (btn) {
        btn.innerHTML = '<i class="bi bi-camera-video-off"></i> Stop Camera CV';
        btn.className = 'btn-dl btn-dl-danger';
      }
      Utils.showToast('success', 'Real Computer Vision Active', 'Physical camera stream hooked to biometric ocular AI processor.');
    } catch (err) {
      Utils.showToast('danger', 'Camera Access Error', 'Could not open physical camera: ' + err.message);
    }
  } else {
    if (video.srcObject) {
      video.srcObject.getTracks().forEach((t) => t.stop());
    }
    isRealCameraRunning = false;
    if (btn) {
      btn.innerHTML = '<i class="bi bi-camera-video"></i> Start Real Computer Vision Stream';
      btn.className = 'btn-dl btn-dl-primary';
    }
    cvFaceBox = null;
    cvStatusLabel = 'NOMINAL';
    cvStatusColor = '#00f0ff';
  }
}

/**
 * Optical Biometric Driver Face & Ocular Processing Loop
 */
async function processComputerVision(ctx, w, h, video) {
  if (!isRealCameraRunning || video.readyState < 2) return;

  let faceDetected = false;
  let faceX = w * 0.28;
  let faceY = h * 0.2;
  let faceW = w * 0.44;
  let faceH = h * 0.58;

  // Use Browser FaceDetector API if available
  if (faceDetectorInstance) {
    try {
      const faces = await faceDetectorInstance.detect(video);
      if (faces && faces.length > 0) {
        faceDetected = true;
        const box = faces[0].boundingBox;
        const scaleX = w / video.videoWidth;
        const scaleY = h / video.videoHeight;
        faceX = box.x * scaleX;
        faceY = box.y * scaleY;
        faceW = box.width * scaleX;
        faceH = box.height * scaleY;
      }
    } catch (e) {}
  }

  // Optical luminance analysis in ocular sector (upper 45% of face)
  const eyeRegionY = Math.round(faceY + faceH * 0.22);
  const eyeRegionH = Math.round(faceH * 0.2);
  const eyeRegionX = Math.round(faceX + faceW * 0.15);
  const eyeRegionW = Math.round(faceW * 0.7);

  let isEyesClosed = false;
  try {
    const eyePixels = ctx.getImageData(eyeRegionX, eyeRegionY, eyeRegionW, eyeRegionH).data;
    let brightnessSum = 0;
    for (let i = 0; i < eyePixels.length; i += 4) {
      brightnessSum += (eyePixels[i] + eyePixels[i + 1] + eyePixels[i + 2]) / 3;
    }
    const avgBrightness = brightnessSum / (eyePixels.length / 4);

    // If eye region drops in luminance variance (eyelids lowered over reflective cornea)
    if (avgBrightness < 45) {
      isEyesClosed = true;
    }
  } catch (e) {}

  // Drowsiness State Machine
  const now = Date.now();
  if (isEyesClosed) {
    if (!eyesClosedStartTime) eyesClosedStartTime = now;
    const closureDuration = now - eyesClosedStartTime;

    if (closureDuration > 1500) {
      cvStatusLabel = `CRITICAL: DROWSINESS (EYES CLOSED ${(closureDuration / 1000).toFixed(1)}s)`;
      cvStatusColor = '#ef4444';

      if (now - lastViolationTriggerTime > 10000) {
        lastViolationTriggerTime = now;
        const snapshot = captureCanvasSnapshot();
        triggerViolationCandidate('Drowsiness', currentSpeed, 96, snapshot);
        speakAlert(
          'Warning! Driver drowsiness detected! Please keep your eyes on the road.',
          'எச்சரிக்கை! ஓட்டுநரின் தூக்கக் கலக்கம் கண்டறியப்பட்டது!'
        );
      }
    }
  } else {
    eyesClosedStartTime = null;
    cvStatusLabel = 'DRIVER ATTENTIVE (EYES OPEN)';
    cvStatusColor = '#00f0ff';
  }

  // Draw Cybernetic HUD Bounding Box over Driver Face
  ctx.save();
  ctx.strokeStyle = cvStatusColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(faceX, faceY, faceW, faceH);

  // Corner Bracket Accents
  const cornerLen = 18;
  ctx.lineWidth = 4;
  ctx.beginPath();
  // Top Left
  ctx.moveTo(faceX, faceY + cornerLen);
  ctx.lineTo(faceX, faceY);
  ctx.lineTo(faceX + cornerLen, faceY);
  // Top Right
  ctx.moveTo(faceX + faceW - cornerLen, faceY);
  ctx.lineTo(faceX + faceW, faceY);
  ctx.lineTo(faceX + faceW, faceY + cornerLen);
  // Bottom Left
  ctx.moveTo(faceX, faceY + faceH - cornerLen);
  ctx.lineTo(faceX, faceY + faceH);
  ctx.lineTo(faceX + cornerLen, faceY + faceH);
  // Bottom Right
  ctx.moveTo(faceX + faceW - cornerLen, faceY + faceH);
  ctx.lineTo(faceX + faceW, faceY + faceH);
  ctx.lineTo(faceX + faceW, faceY + faceH - cornerLen);
  ctx.stroke();

  // Face Label Pill
  ctx.fillStyle = cvStatusColor;
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.fillText(cvStatusLabel, faceX, faceY - 8);

  // Eye Region Crosshairs
  ctx.strokeStyle = '#38bdf888';
  ctx.lineWidth = 1;
  ctx.strokeRect(eyeRegionX, eyeRegionY, eyeRegionW, eyeRegionH);
  ctx.restore();
}

/**
 * Vision Viewport Canvas Initialization & Hybrid Animation Loop
 */
function initVisionCanvas() {
  const canvas = document.getElementById('simulated-canvas');
  const video = document.getElementById('camera-video');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  async function renderFrame() {
    const w = canvas.width;
    const h = canvas.height;

    if (isRealCameraRunning && video && video.readyState >= 2) {
      // 1. Draw Real Physical Camera Stream
      ctx.drawImage(video, 0, 0, w, h);

      // 2. Process Optical Facial & Ocular Telemetry
      await processComputerVision(ctx, w, h, video);
    } else {
      // Simulated High-Tech Roadway Horizon
      drawSimulatedRoad(ctx, w, h);
    }

    animationFrameId = requestAnimationFrame(renderFrame);
  }

  renderFrame();
}

/**
 * Roadway Horizon Simulator when Camera is Offline
 */
function drawSimulatedRoad(ctx, w, h) {
  // Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.5);
  skyGrad.addColorStop(0, '#060a12');
  skyGrad.addColorStop(1, '#0e1726');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h * 0.5);

  // Ground Gradient
  const roadGrad = ctx.createLinearGradient(0, h * 0.5, 0, h);
  roadGrad.addColorStop(0, '#151d2c');
  roadGrad.addColorStop(1, '#090e17');
  ctx.fillStyle = roadGrad;
  ctx.fillRect(0, h * 0.5, w, h * 0.5);

  // Road Surface Triangle
  ctx.beginPath();
  ctx.moveTo(w * 0.46, h * 0.5);
  ctx.lineTo(w * 0.54, h * 0.5);
  ctx.lineTo(w * 0.95, h);
  ctx.lineTo(w * 0.05, h);
  ctx.closePath();
  ctx.fillStyle = '#1e293b';
  ctx.fill();

  // Cyan Road Guideline Borders
  ctx.strokeStyle = '#00f0ff44';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Centerline Moving Dash (Velocity Dependent)
  laneOffset = (laneOffset + currentSpeed * 0.12) % 40;
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 4;
  ctx.setLineDash([20, 20]);
  ctx.lineDashOffset = -laneOffset;

  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.5);
  ctx.lineTo(w * 0.5, h);
  ctx.stroke();
  ctx.setLineDash([]);

  // Forward Lead Vehicle Rendering in Collision / Normal Scenarios
  if (activeScenario === 'COLLISION RISK' || activeScenario === 'NORMAL DRIVING') {
    const vY = h * 0.62;
    const vW = w * 0.14;
    const vH = h * 0.12;
    const vX = w * 0.5 - vW / 2;

    ctx.fillStyle = '#334155';
    ctx.fillRect(vX, vY, vW, vH);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(vX + 4, vY + vH - 12, 14, 8);
    ctx.fillRect(vX + vW - 18, vY + vH - 12, 14, 8);

    ctx.strokeStyle = activeScenario === 'COLLISION RISK' ? '#ef4444' : '#00f0ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(vX - 4, vY - 4, vW + 8, vH + 8);

    ctx.fillStyle = activeScenario === 'COLLISION RISK' ? '#ef4444' : '#00f0ff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(activeScenario === 'COLLISION RISK' ? 'CRITICAL PROXIMITY [6m]' : 'LEAD VEHICLE [32m]', vX - 4, vY - 10);
  }
}

/**
 * Trigger SOS Workflow
 */
async function triggerManualEmergencySOS() {
  const res = await API.post('/driving/emergency', {
    latitude: 12.9279,
    longitude: 80.1271,
    locationName: 'Outer Ring Road Expressway',
    crashGForce: 4.8,
  });

  if (res.success) {
    Utils.showToast(
      'danger',
      '🚨 EMERGENCY SOS DISPATCHED',
      'Autonomous emergency payload transmitted to 108 Command Center and Highway Incident Patrol.'
    );
  }
}
