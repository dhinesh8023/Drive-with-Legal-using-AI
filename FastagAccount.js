const mongoose = require("mongoose");

/**
 * FASTag account in DEMO MODE. This is NOT a connection to any real
 * bank or NHAI FASTag system — see services/fastagProviderAdapter.js
 * for where a real, authorized integration would be plugged in.
 */
const fastagTransactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["TOLL", "RECHARGE", "FINE_PAYMENT"], required: true },
    amount: { type: Number, required: true },
    description: { type: String, trim: true },
    balanceAfter: { type: Number, required: true },
    reference: { type: String },
  },
  { timestamps: true }
);

const fastagAccountSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true, unique: true },

    fastagId: { type: String, required: true, unique: true, index: true },
    demoBalance: { type: Number, default: 500, min: 0 },

    transactions: [fastagTransactionSchema],

    isDemo: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FastagAccount", fastagAccountSchema);
