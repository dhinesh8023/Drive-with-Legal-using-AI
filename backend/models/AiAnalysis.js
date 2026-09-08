const mongoose = require("mongoose");

/**
 * Stores a copy of every explainable AI response the ai-service returns,
 * so risk scores and violation confidences can be audited later —
 * not just trusted in the moment they were generated.
 */
const aiAnalysisSchema = new mongoose.Schema(
  {
    requestType: {
      type: String,
      enum: [
        "RISK_PREDICTION",
        "DRIVER_MONITOR",
        "ROAD_DETECTION",
        "COLLISION_RISK",
        "VIOLATION_DETECTION",
        "ANOMALY_DETECTION",
      ],
      required: true,
    },

    relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    relatedSession: { type: mongoose.Schema.Types.ObjectId, ref: "DrivingSession" },
    relatedViolation: { type: mongoose.Schema.Types.ObjectId, ref: "Violation" },

    inputSnapshot: { type: mongoose.Schema.Types.Mixed },

    riskScore: { type: Number },
    riskLevel: { type: String },
    confidence: { type: Number, min: 0, max: 1 },
    reasons: [{ type: String }],
    recommendations: [{ type: String }],

    isDemoMode: { type: Boolean, default: true },
    modelVersion: { type: String, default: "demo-v1" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AiAnalysis", aiAnalysisSchema);
