const axios = require("axios");
const { calculateRisk } = require("./riskEngine");

/**
 * Thin client around the FastAPI ai-service. If the AI service is
 * unreachable (e.g. not started in a quick local demo), we fall back
 * to the local Node risk engine so the platform stays usable — this
 * fallback is always clearly labeled in the response.
 */

const AI_BASE_URL = process.env.AI_SERVER_URL || "http://127.0.0.1:8000";
const client = axios.create({ baseURL: AI_BASE_URL, timeout: 4000 });

async function predictRisk(payload) {
  try {
    const { data } = await client.post("/predict-risk", payload);
    return { ...data, source: "AI_SERVICE" };
  } catch (err) {
    const fallback = calculateRisk(payload);
    return {
      status: "success",
      riskScore: fallback.riskScore,
      riskLevel: fallback.riskLevel,
      confidence: fallback.confidence,
      reasons: fallback.reasons,
      recommendations: [fallback.recommendation],
      source: "NODE_FALLBACK",
      note: "AI service unreachable; used local rule-based fallback engine.",
    };
  }
}

async function driverMonitor(payload) {
  try {
    const { data } = await client.post("/driver-monitor", payload);
    return { ...data, source: "AI_SERVICE" };
  } catch (err) {
    return {
      status: "success",
      source: "NODE_FALLBACK",
      note: "AI service unreachable.",
      attention: payload.attention ?? 90,
      drowsinessDetected: false,
      distractionDetected: false,
    };
  }
}

async function violationDetection(payload) {
  const { data } = await client.post("/violation-detection", payload);
  return { ...data, source: "AI_SERVICE" };
}

async function collisionRisk(payload) {
  const { data } = await client.post("/collision-risk", payload);
  return { ...data, source: "AI_SERVICE" };
}

async function roadDetection(payload) {
  const { data } = await client.post("/road-detection", payload);
  return { ...data, source: "AI_SERVICE" };
}

async function healthCheck() {
  try {
    const { data } = await client.get("/health");
    return { reachable: true, ...data };
  } catch (err) {
    return { reachable: false, error: err.message };
  }
}

module.exports = {
  predictRisk,
  driverMonitor,
  violationDetection,
  collisionRisk,
  roadDetection,
  healthCheck,
};
