const mongoose = require("mongoose");
const { FINE_STATUS } = require("../config/constants");

const fineSchema = new mongoose.Schema(
  {
    fineCode: { type: String, required: true, unique: true, index: true }, // e.g. DL-2026-0001

    violation: { type: mongoose.Schema.Types.ObjectId, ref: "Violation", required: true, index: true },
    fineRule: { type: mongoose.Schema.Types.ObjectId, ref: "FineRule", required: true },

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },

    amount: { type: Number, required: true, min: 0 }, // snapshot of FineRule.baseFineAmount at creation time
    dueDate: { type: Date, required: true },

    status: {
      type: String,
      enum: Object.values(FINE_STATUS),
      default: FINE_STATUS.PENDING,
      index: true,
    },

    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // officer
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    dispute: { type: mongoose.Schema.Types.ObjectId, ref: "Dispute" },

    notificationStatus: {
      lastReminderLevel: { type: String },
      lastSentAt: { type: Date },
    },
  },
  { timestamps: true }
);

fineSchema.index({ dueDate: 1, status: 1 });

module.exports = mongoose.model("Fine", fineSchema);
