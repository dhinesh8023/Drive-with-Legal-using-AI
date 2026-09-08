const mongoose = require("mongoose");
const { VIOLATION_TYPES } = require("../config/constants");

/**
 * Fine amounts are entirely configurable by ADMIN and stored here.
 * This project never hardcodes real-world statutory fine amounts —
 * all values here are DEMO / CONFIGURED RULES for the prototype.
 */
const fineRuleSchema = new mongoose.Schema(
  {
    violationType: {
      type: String,
      enum: Object.values(VIOLATION_TYPES),
      required: true,
      unique: true,
    },
    baseFineAmount: { type: Number, required: true, min: 0 }, // DEMO amount, admin-configurable
    description: { type: String, trim: true },
    duePeriodDays: { type: Number, default: 15, min: 1 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FineRule", fineRuleSchema);
