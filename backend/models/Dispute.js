const mongoose = require("mongoose");
const { DISPUTE_STATUS } = require("../config/constants");

const decisionHistoryEntrySchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // e.g. "SUBMITTED", "REQUEST_MORE_INFO", "ACCEPTED"
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    note: { type: String, trim: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const disputeSchema = new mongoose.Schema(
  {
    fine: { type: mongoose.Schema.Types.ObjectId, ref: "Fine", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    reason: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    supportingEvidenceUrl: { type: String },

    status: {
      type: String,
      enum: Object.values(DISPUTE_STATUS),
      default: DISPUTE_STATUS.RECEIVED,
      index: true,
    },

    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    decisionHistory: [decisionHistoryEntrySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dispute", disputeSchema);
