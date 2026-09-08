const mongoose = require("mongoose");
const { EMERGENCY_STATUS } = require("../config/constants");

/**
 * Prototype-mode emergency handling. No real emergency service is
 * ever contacted automatically — see services/emergencyService.js.
 * All outbound "dispatch" actions in this project are simulated
 * and require explicit manual confirmation in the UI.
 */
const emergencyEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    drivingSession: { type: mongoose.Schema.Types.ObjectId, ref: "DrivingSession" },

    triggerReason: { type: String, required: true }, // e.g. "COLLISION_RISK_SPIKE", "MANUAL"
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
    },

    status: {
      type: String,
      enum: Object.values(EMERGENCY_STATUS),
      default: EMERGENCY_STATUS.DETECTED,
    },

    userRespondedAt: { type: Date },
    resolvedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmergencyEvent", emergencyEventSchema);
