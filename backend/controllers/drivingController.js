const DrivingSession = require("../models/DrivingSession");
const AiAnalysis = require("../models/AiAnalysis");
const { success, error } = require("../utils/apiResponse");
const { predictRisk } = require("../services/aiServiceClient");

async function startSession(req, res, next) {
  try {
    const { vehicleId, isDemoMode } = req.body;
    const session = await DrivingSession.create({
      user: req.user._id,
      vehicle: vehicleId,
      isDemoMode: isDemoMode !== false,
      startedAt: new Date(),
    });
    return success(res, 201, "Driving session started.", { session });
  } catch (err) {
    next(err);
  }
}

/**
 * Pushes one telemetry/scenario update: asks the AI (or fallback engine)
 * for a risk score, appends it to the session timeline, and broadcasts
 * it over Socket.IO so the live-drive.html page updates in real time.
 */
async function updateSession(req, res, next) {
  try {
    const sessionId = req.params.id || req.body.sessionId;
    const session = await DrivingSession.findById(sessionId);
    if (!session) return error(res, 404, "Driving session not found.");
    if (session.user.toString() !== req.user._id.toString()) return error(res, 403, "Forbidden.");

    const { scenario, ...riskInput } = req.body;

    const aiResult = await predictRisk(riskInput);

    const snapshot = {
      timestamp: new Date(),
      scenario,
      riskScore: aiResult.riskScore,
      riskLevel: aiResult.riskLevel,
      reasons: aiResult.reasons,
      recommendation: Array.isArray(aiResult.recommendations) ? aiResult.recommendations[0] : aiResult.recommendation,
      speed: riskInput.speed,
      recommendedSpeed: aiResult.recommendedSpeed,
    };

    session.timeline.push(snapshot);
    await session.save();

    await AiAnalysis.create({
      requestType: "RISK_PREDICTION",
      relatedUser: req.user._id,
      relatedSession: session._id,
      inputSnapshot: riskInput,
      riskScore: aiResult.riskScore,
      riskLevel: aiResult.riskLevel,
      confidence: aiResult.confidence,
      reasons: aiResult.reasons,
      recommendations: aiResult.recommendations,
      isDemoMode: session.isDemoMode,
    });

    // Broadcast to any connected dashboards/live-drive clients for this user.
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${req.user._id}`).emit("risk:updated", { sessionId: session._id, ...snapshot });
    }

    return success(res, 200, "Session updated.", { snapshot, session });
  } catch (err) {
    next(err);
  }
}

async function endSession(req, res, next) {
  try {
    const sessionId = req.params.id || req.body.sessionId;
    const session = await DrivingSession.findById(sessionId);
    if (!session) return error(res, 404, "Driving session not found.");
    if (session.user.toString() !== req.user._id.toString()) return error(res, 403, "Forbidden.");

    session.endedAt = new Date();

    const scores = session.timeline.map((t) => t.riskScore).filter((n) => typeof n === "number");
    if (scores.length) {
      session.summary.averageRiskScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      session.summary.peakRiskScore = Math.max(...scores);
      const peakEntry = session.timeline.find((t) => t.riskScore === session.summary.peakRiskScore);
      session.summary.peakRiskLevel = peakEntry ? peakEntry.riskLevel : undefined;
    }
    session.summary.durationMinutes = Math.round((session.endedAt - session.startedAt) / 60000);

    await session.save();
    return success(res, 200, "Driving session ended.", { session });
  } catch (err) {
    next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const sessions = await DrivingSession.find({ user: req.user._id }).sort({ startedAt: -1 }).limit(50);
    return success(res, 200, "Driving session history fetched.", { sessions, count: sessions.length });
  } catch (err) {
    next(err);
  }
}

module.exports = { startSession, updateSession, endSession, getHistory };
