const mongoose = require("mongoose");

/**
 * A Blackspot is an AI-ASSISTED RISK ESTIMATE, never a certified
 * official designation. Always surface it to users/staff labeled
 * as a prediction, alongside the inputs that produced it.
 */
const blackspotSchema = new mongoose.Schema(
  {
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      roadName: { type: String, trim: true },
      district: { type: String, trim: true },
    },

    riskPercentage: { type: Number, required: true, min: 0, max: 100 },
    riskLevel: { type: String, enum: ["LOW", "MODERATE", "HIGH", "CRITICAL"], required: true },

    contributingFactors: {
      historicalAccidentCount: { type: Number, default: 0 },
      nearMissCount: { type: Number, default: 0 },
      hazardReportCount: { type: Number, default: 0 },
      violationDensity: { type: Number, default: 0 },
      trafficFactor: { type: Number, default: 0 },
      weatherFactor: { type: Number, default: 0 },
    },

    recommendations: [{ type: String }],

    lastCalculatedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

blackspotSchema.index({ "location.latitude": 1, "location.longitude": 1 });

module.exports = mongoose.model("Blackspot", blackspotSchema);
