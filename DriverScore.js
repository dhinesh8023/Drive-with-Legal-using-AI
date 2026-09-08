const mongoose = require("mongoose");

const driverScoreSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    score: { type: Number, required: true, min: 0, max: 100 },
    category: {
      type: String,
      enum: ["EXCELLENT", "GOOD", "NEEDS_IMPROVEMENT", "HIGH_RISK"],
      required: true,
    },

    factors: {
      safeDrivingPoints: { type: Number, default: 0 },
      overspeedingPenalty: { type: Number, default: 0 },
      suddenBrakingPenalty: { type: Number, default: 0 },
      drowsinessPenalty: { type: Number, default: 0 },
      distractionPenalty: { type: Number, default: 0 },
      violationPenalty: { type: Number, default: 0 },
      consistencyBonus: { type: Number, default: 0 },
    },

    recommendations: [{ type: String }],
    calculatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

driverScoreSchema.index({ user: 1, calculatedAt: -1 });

module.exports = mongoose.model("DriverScore", driverScoreSchema);
