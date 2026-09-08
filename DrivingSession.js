const mongoose = require("mongoose");
const { RISK_LEVELS } = require("../config/constants");

const riskSnapshotSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    scenario: { type: String }, // e.g. "OVERSPEEDING", "HEAVY_RAIN" (demo mode) or "LIVE_AI"
    riskScore: { type: Number, min: 0, max: 100 },
    riskLevel: { type: String, enum: Object.values(RISK_LEVELS) },
    reasons: [{ type: String }],
    recommendation: { type: String },
    speed: { type: Number },
    recommendedSpeed: { type: Number },
  },
  { _id: false }
);

const drivingSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },

    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },

    isDemoMode: { type: Boolean, default: true },

    timeline: [riskSnapshotSchema],

    summary: {
      averageRiskScore: { type: Number },
      peakRiskScore: { type: Number },
      peakRiskLevel: { type: String, enum: Object.values(RISK_LEVELS) },
      distanceKm: { type: Number },
      durationMinutes: { type: Number },
      violationsFlagged: { type: Number, default: 0 },
      nearMissesFlagged: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DrivingSession", drivingSessionSchema);
