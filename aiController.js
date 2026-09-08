const aiClient = require("../services/aiServiceClient");
const AiAnalysis = require("../models/AiAnalysis");
const { success, error } = require("../utils/apiResponse");

async function analyze(req, res, next) {
  try {
    const result = await aiClient.predictRisk(req.body);
    return success(res, 200, "AI analysis completed.", result);
  } catch (err) {
    next(err);
  }
}

async function riskPrediction(req, res, next) {
  try {
    const result = await aiClient.predictRisk(req.body);

    await AiAnalysis.create({
      requestType: "RISK_PREDICTION",
      relatedUser: req.user?._id,
      inputSnapshot: req.body,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      confidence: result.confidence,
      reasons: result.reasons,
      recommendations: result.recommendations,
    });

    return success(res, 200, "Risk prediction completed.", result);
  } catch (err) {
    next(err);
  }
}

async function driverMonitor(req, res, next) {
  try {
    const result = await aiClient.driverMonitor(req.body);
    return success(res, 200, "Driver monitoring completed.", result);
  } catch (err) {
    next(err);
  }
}

async function roadDetection(req, res, next) {
  try {
    const result = await aiClient.roadDetection(req.body);
    return success(res, 200, "Road detection completed.", result);
  } catch (err) {
    next(err);
  }
}

async function collisionRisk(req, res, next) {
  try {
    const result = await aiClient.collisionRisk(req.body);
    return success(res, 200, "Collision risk assessment completed.", result);
  } catch (err) {
    next(err);
  }
}

async function violationDetection(req, res, next) {
  try {
    const result = await aiClient.violationDetection(req.body);
    return success(res, 200, "AI-assisted violation detection completed.", result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  analyze,
  riskPrediction,
  driverMonitor,
  roadDetection,
  collisionRisk,
  violationDetection,
};
