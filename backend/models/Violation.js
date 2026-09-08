const mongoose = require("mongoose");
const {
  VIOLATION_TYPES,
  VIOLATION_REVIEW_STATUS,
  DETECTION_SOURCE,
} = require("../config/constants");

/**
 * IMPORTANT: A Violation is a "candidate" until an authorized officer
 * reviews it. AI detection alone never finalizes a legally enforceable
 * fine — see reviewStatus workflow and Fine model.
 */
const violationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", index: true },
    vehicleNumber: { type: String, trim: true, uppercase: true },

    violationType: {
      type: String,
      enum: Object.values(VIOLATION_TYPES),
      required: true,
      index: true,
    },

    location: {
      address: { type: String, trim: true },
      latitude: { type: Number },
      longitude: { type: Number },
      roadName: { type: String, trim: true },
      district: { type: String, trim: true },
    },

    occurredAt: { type: Date, required: true, default: Date.now },

    evidence: {
      imageUrl: { type: String },
      videoRef: { type: String },
    },

    aiConfidence: { type: Number, min: 0, max: 1 }, // 0.0 - 1.0, always AI-labeled as an estimate
    riskScoreAtDetection: { type: Number, min: 0, max: 100 },

    detectionSource: {
      type: String,
      enum: Object.values(DETECTION_SOURCE),
      default: DETECTION_SOURCE.AI_CAMERA,
    },

    reviewStatus: {
      type: String,
      enum: Object.values(VIOLATION_REVIEW_STATUS),
      default: VIOLATION_REVIEW_STATUS.PENDING_REVIEW,
      index: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    officerNotes: { type: String, trim: true },

    fine: { type: mongoose.Schema.Types.ObjectId, ref: "Fine" },

    // Set true once this candidate has produced a Fine (avoids double-fining same candidate)
    fineGenerated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

violationSchema.index({ occurredAt: -1 });
violationSchema.index({ "location.district": 1 });

module.exports = mongoose.model("Violation", violationSchema);
