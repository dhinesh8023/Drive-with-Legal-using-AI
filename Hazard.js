const mongoose = require("mongoose");
const { HAZARD_TYPES, HAZARD_SEVERITY } = require("../config/constants");

const hazardSchema = new mongoose.Schema(
  {
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    hazardType: { type: String, enum: Object.values(HAZARD_TYPES), required: true, index: true },
    severity: { type: String, enum: Object.values(HAZARD_SEVERITY), default: HAZARD_SEVERITY.MODERATE },

    description: { type: String, trim: true },
    photoUrl: { type: String },

    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String, trim: true },
    },

    // Increases each time a nearby report of the same type is filed (AI duplicate-clustering)
    confidenceScore: { type: Number, default: 0.5, min: 0, max: 1 },
    duplicateReportCount: { type: Number, default: 0 },

    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

hazardSchema.index({ "location.latitude": 1, "location.longitude": 1 });

module.exports = mongoose.model("Hazard", hazardSchema);
