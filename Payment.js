const mongoose = require("mongoose");
const { PAYMENT_STATUS, PAYMENT_METHODS } = require("../config/constants");

const paymentSchema = new mongoose.Schema(
  {
    fine: { type: mongoose.Schema.Types.ObjectId, ref: "Fine", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: Object.values(PAYMENT_METHODS), required: true },

    transactionReference: { type: String, required: true, unique: true, index: true },

    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.INITIATED,
      index: true,
    },

    // Never trust only a frontend "success" message — backend verification is mandatory.
    verifiedAt: { type: Date },
    verifiedBy: { type: String, default: "SYSTEM" }, // "SYSTEM" (auto/demo) or officer/admin id

    isDemo: { type: Boolean, default: true }, // true unless PAYMENT_MODE=live at creation time

    failureReason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
