const mongoose = require("mongoose");
const { NEAR_MISS_TYPES } = require("../config/constants");

const nearMissSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
    drivingSession: { type: mongoose.Schema.Types.ObjectId, ref: "DrivingSession" },

    eventType: { type: String, enum: Object.values(NEAR_MISS_TYPES), required: true, index: true },

    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      roadName: { type: String, trim: true },
    },

    context: {
      trafficDensity: { type: String, enum: ["LOW", "MODERATE", "HIGH"] },
      roadCondition: { type: String, enum: ["DRY", "WET", "DAMAGED", "UNDER_CONSTRUCTION"] },
      weather: { type: String },
      speedAtEvent: { type: Number },
    },

    occurredAt: { type: Date, default: Date.now },

    // Feeds into blackspot prediction — see services/riskEngine.js
    contributedToBlackspot: { type: mongoose.Schema.Types.ObjectId, ref: "Blackspot" },
  },
  { timestamps: true }
);

nearMissSchema.index({ "location.latitude": 1, "location.longitude": 1 });

module.exports = mongoose.model("NearMiss", nearMissSchema);
