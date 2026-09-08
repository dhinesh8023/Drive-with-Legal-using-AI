/**
 * Drives the live-drive.html page: scenario buttons, camera permission,
 * AI risk calls (direct to ai-service for low latency), voice co-driver
 * alerts (Web Speech API, English/Tamil), and driving-session logging
 * to the backend so the timeline/history persists.
 */

const SCENARIOS = [
  { key: "NORMAL", label: "Normal Driving" },
  { key: "OVERSPEEDING", label: "Overspeeding" },
  { key: "DROWSINESS", label: "Drowsiness" },
  { key: "DISTRACTION", label: "Distraction" },
  { key: "MOBILE_USAGE", label: "Mobile Phone Usage" },
  { key: "POTHOLE", label: "Pothole" },
  { key: "UNSAFE_OVERTAKING", label: "Unsafe Overtaking" },
  { key: "WRONG_SIDE_DRIVING", label: "Wrong Side Driving" },
  { key: "HEAVY_RAIN", label: "Heavy Rain" },
  { key: "LANE_DEPARTURE", label: "Lane Departure" },
  { key: "SUDDEN_BRAKING", label: "Sudden Braking" },
  { key: "COLLISION_RISK", label: "Collision Risk" },
  { key: "ACCIDENT", label: "Accident" },
];

const VOICE_ALERTS = {
  en: {
    OVERSPEEDING: "Warning. Reduce speed.",
    DROWSINESS: "Driver attention is low. Please take a break.",
    DISTRACTION: "Driver attention is low.",
    MOBILE_USAGE: "Please avoid using your phone while driving.",
    POTHOLE: "Pothole detected ahead.",
    COLLISION_RISK: "Collision risk detected.",
    SUDDEN_BRAKING: "Unsafe following distance.",
    HEAVY_RAIN: "Heavy rain detected. Recommended speed reduced.",
    WRONG_SIDE_DRIVING: "Warning. Wrong side driving detected.",
    ACCIDENT: "Accident risk critical. Reduce speed immediately.",
  },
  ta: {
    OVERSPEEDING: "எச்சரிக்கை. வேகத்தைக் குறைக்கவும்.",
    DROWSINESS: "ஓட்டுநரின் கவனம் குறைவாக உள்ளது.",
    DISTRACTION: "ஓட்டுநரின் கவனம் குறைவாக உள்ளது.",
    MOBILE_USAGE: "ஓட்டும்போது மொபைல் பயன்பாட்டைத் தவிர்க்கவும்.",
    POTHOLE: "முன்னால் பள்ளம் உள்ளது.",
    COLLISION_RISK: "மோதல் அபாயம் கண்டறியப்பட்டுள்ளது.",
    SUDDEN_BRAKING: "பாதுகாப்பற்ற பின்தொடர் தூரம்.",
    HEAVY_RAIN: "கனமழை கண்டறியப்பட்டது. பரிந்துரைக்கப்பட்ட வேகம் குறைக்கப்பட்டது.",
    WRONG_SIDE_DRIVING: "எச்சரிக்கை. தவறான பக்க ஓட்டுநர் கண்டறியப்பட்டது.",
    ACCIDENT: "விபத்து ஆபத்து அதிகம். உடனடியாக வேகத்தைக் குறைக்கவும்.",
  },
};

let currentScenario = "NORMAL";
let sessionId = null;
let sessionTimeline = [];
let voiceSettings = { enabled: true, lang: "en", volume: 1, frequency: "normal" };
let lastSpokenScenario = null;

function initScenarioButtons() {
  const grid = document.getElementById("scenarioGrid");
  grid.innerHTML = SCENARIOS.map(
    (s) => `<button class="btn-scenario" data-scenario="${s.key}" onclick="selectScenario('${s.key}')">${s.label}</button>`
  ).join("");
}

async function selectScenario(key) {
  currentScenario = key;
  document.querySelectorAll(".btn-scenario").forEach((b) => b.classList.toggle("active", b.dataset.scenario === key));
  await refreshRisk();
}

async function refreshRisk() {
  try {
    const result = await aiApi.predictRisk({
      speed: 60,
      speedLimit: 60,
      scenario: currentScenario,
    });
    renderRisk(result);
    logSnapshot(result);
    maybeSpeak(result);
  } catch (err) {
    Utils.toast("Could not reach AI service. Is it running on port 8000?", "error");
  }
}

function renderRisk(result) {
  const gaugeNum = document.getElementById("riskGaugeNumber");
  const gaugeBadge = document.getElementById("riskGaugeBadge");
  gaugeNum.textContent = result.riskScore;
  gaugeNum.className = "risk-gauge-number text-" + result.riskLevel.toLowerCase();
  gaugeBadge.textContent = result.riskLevel;
  gaugeBadge.className = "risk-badge risk-" + result.riskLevel;

  document.getElementById("recommendationText").textContent = result.recommendations
    ? result.recommendations.join(" ")
    : result.recommendation || "";

  document.getElementById("confidenceValue").textContent = Math.round((result.confidence || 0) * 100) + "%";

  const reasonsList = document.getElementById("reasonsList");
  const breakdown = result.breakdown || {};
  const reasons = result.reasons || [];
  if (reasons.length === 0) {
    reasonsList.innerHTML = `<div class="empty-state">No significant risk factors detected.</div>`;
  } else {
    const maxVal = Math.max(1, ...Object.values(breakdown));
    reasonsList.innerHTML = reasons
      .map((r) => {
        const key = Object.keys(breakdown).find((k) => r.toLowerCase().includes(k.toLowerCase().replace(/([A-Z])/g, " $1").trim().split(" ")[0])) ;
        const val = breakdown[key] || 10;
        const pct = Math.min(100, (val / maxVal) * 100);
        return `<div class="reason-item">
          <span>${r}</span>
          <div class="reason-bar-track"><div class="reason-bar-fill" style="width:${pct}%"></div></div>
          <span class="text-muted">+${val}</span>
        </div>`;
      })
      .join("");
  }
}

function logSnapshot(result) {
  sessionTimeline.push({
    timestamp: new Date(),
    scenario: currentScenario,
    riskScore: result.riskScore,
    riskLevel: result.riskLevel,
  });
  if (sessionTimeline.length > 20) sessionTimeline.shift();
  renderTimeline();
}

function renderTimeline() {
  const strip = document.getElementById("timelineStrip");
  strip.innerHTML = sessionTimeline
    .map((snap) => {
      const colorVar = { SAFE: "var(--safe)", MODERATE: "var(--moderate)", HIGH: "var(--high)", CRITICAL: "var(--critical)" }[snap.riskLevel];
      return `<div class="timeline-bar" title="${snap.scenario}: ${snap.riskScore}" style="height:${snap.riskScore}%; background:${colorVar};"></div>`;
    })
    .join("");
}

function maybeSpeak(result) {
  if (!voiceSettings.enabled) return;
  if (!("speechSynthesis" in window)) return;
  if (currentScenario === lastSpokenScenario) return;
  lastSpokenScenario = currentScenario;

  const phrase = VOICE_ALERTS[voiceSettings.lang]?.[currentScenario];
  if (!phrase) return;

  const utter = new SpeechSynthesisUtterance(phrase);
  utter.lang = voiceSettings.lang === "ta" ? "ta-IN" : "en-IN";
  utter.volume = voiceSettings.volume;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

async function requestCamera() {
  const video = document.getElementById("cameraFeed");
  const placeholder = document.getElementById("cameraPlaceholder");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.style.display = "block";
    placeholder.style.display = "none";
    Utils.toast("Camera enabled. Running in AI-assisted demo overlay mode.", "success");
  } catch (err) {
    Utils.toast("Camera permission denied or unavailable. Continuing in demo mode.", "info");
  }
}

async function startSession() {
  try {
    const vehicles = await api.get("/vehicles");
    const vehicleId = vehicles.vehicles?.[0]?._id;
    const session = await api.post("/driving/start", { vehicle: vehicleId, isDemoMode: true });
    sessionId = session.session._id;
    document.getElementById("sessionStatus").textContent = "Session active";
    document.getElementById("sessionStatus").className = "pill pill-approved";
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

async function endSession() {
  if (!sessionId) return;
  try {
    await api.post("/driving/end", { sessionId, timeline: sessionTimeline });
    Utils.toast("Driving session saved.", "success");
    document.getElementById("sessionStatus").textContent = "Session ended";
    document.getElementById("sessionStatus").className = "pill pill-pending";
    sessionId = null;
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

function bindVoiceSettings() {
  document.getElementById("voiceEnabledToggle").addEventListener("change", (e) => {
    voiceSettings.enabled = e.target.checked;
  });
  document.getElementById("voiceLangSelect").addEventListener("change", (e) => {
    voiceSettings.lang = e.target.value;
  });
  document.getElementById("voiceVolumeRange").addEventListener("input", (e) => {
    voiceSettings.volume = Number(e.target.value);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = renderShell("live-drive", "Live AI Drive");
  if (!user) return;

  initScenarioButtons();
  bindVoiceSettings();
  document.getElementById("enableCameraBtn").addEventListener("click", requestCamera);
  document.getElementById("startSessionBtn").addEventListener("click", startSession);
  document.getElementById("endSessionBtn").addEventListener("click", endSession);

  await selectScenario("NORMAL");
});
