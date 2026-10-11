const axios = require('axios');
const riskEngine = require('../services/riskEngine');

const AI_URL = process.env.AI_SERVER_URL || 'http://127.0.0.1:8000';

/**
 * Helper to call AI service or fallback
 */
const proxyAi = async (endpoint, payload, fallbackFn) => {
  try {
    const res = await axios.post(`${AI_URL}${endpoint}`, payload, { timeout: 1500 });
    if (res.data) return res.data;
  } catch (err) {
    // Graceful fallback to internal engine
  }
  return fallbackFn(payload);
};

const analyze = async (req, res, next) => {
  try {
    const result = await proxyAi('/analyze', req.body, (data) => riskEngine.internalEvaluate(data));
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const predictRisk = async (req, res, next) => {
  try {
    const result = await proxyAi('/predict-risk', req.body, (data) => riskEngine.internalEvaluate(data));
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const driverMonitor = async (req, res, next) => {
  try {
    const fallback = (data) => {
      const { eyesClosed = false, phoneDetected = false, headYaw = 0 } = data;
      const attention = eyesClosed ? 25 : phoneDetected ? 40 : Math.max(30, 95 - Math.abs(headYaw));
      return {
        status: 'success',
        driverAttention: attention,
        drowsiness: eyesClosed ? 85 : 10,
        distraction: phoneDetected ? 90 : Math.abs(headYaw) > 20 ? 60 : 5,
        statusLabel: attention > 75 ? 'ATTENTIVE' : attention > 50 ? 'MODERATE ATTENTION' : 'DISTRACTED / DROWSY',
        recommendation: attention < 50 ? 'Auditory chime: Refocus on forward roadway' : 'Nominal driving posture',
      };
    };

    const result = await proxyAi('/driver-monitor', req.body, fallback);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const roadDetection = async (req, res, next) => {
  try {
    const fallback = (data) => ({
      status: 'success',
      detectedHazards: data.potholes ? ['Pothole Grade 2'] : [],
      roadQualityScore: data.weather === 'Heavy Rain' ? 45 : 82,
      laneMarkingClarity: 88,
      recommendedSpeed: data.weather === 'Heavy Rain' ? 45 : 60,
    });

    const result = await proxyAi('/road-detection', req.body, fallback);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const collisionRisk = async (req, res, next) => {
  try {
    const fallback = (data) => {
      const { speed = 50, followingDistance = 25 } = data;
      const ttc = (followingDistance / (Math.max(1, speed) * 0.277)).toFixed(2); // Time to collision in seconds
      const riskLevel = ttc < 1.5 ? 'CRITICAL' : ttc < 2.5 ? 'HIGH' : 'SAFE';
      return {
        status: 'success',
        timeToCollisionSeconds: Number(ttc),
        collisionRiskLevel: riskLevel,
        recommendedAction: riskLevel === 'CRITICAL' ? 'EMERGENCY BRAKING REQUIRED' : 'Maintain safe gap',
      };
    };

    const result = await proxyAi('/collision-risk', req.body, fallback);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const violationDetection = async (req, res, next) => {
  try {
    const fallback = (data) => {
      const { speed = 50, speedLimit = 60, helmetDetected = true } = data;
      const isOverspeeding = speed > speedLimit;
      const isHelmetViolation = !helmetDetected;

      return {
        status: 'success',
        violationsDetected: isOverspeeding
          ? ['Overspeeding']
          : isHelmetViolation
          ? ['Helmet Violation']
          : [],
        confidence: 0.92,
        isAiCandidate: isOverspeeding || isHelmetViolation,
      };
    };

    const result = await proxyAi('/violation-detection', req.body, fallback);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  analyze,
  predictRisk,
  driverMonitor,
  roadDetection,
  collisionRisk,
  violationDetection,
};
