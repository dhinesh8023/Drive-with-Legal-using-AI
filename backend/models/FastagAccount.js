const mongoose = require('mongoose');

const fastagAccountSchema = new mongoose.Schema(
  {
    fastagId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
      uppercase: true,
    },
    currentBalance: {
      type: Number,
      required: true,
      default: 2500,
      min: 0,
    },
    issuingBank: {
      type: String,
      default: 'NPCI NETC / Demo Partner Bank',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'LOW_BALANCE', 'SUSPENDED', 'BLACKLISTED'],
      default: 'ACTIVE',
    },
    lowBalanceThreshold: {
      type: Number,
      default: 200,
    },
    transactions: [
      {
        transactionId: { type: String, required: true },
        type: {
          type: String,
          enum: ['TOLL_DEDUCTION', 'FINE_PAYMENT', 'WALLET_RECHARGE'],
          required: true,
        },
        amount: { type: Number, required: true },
        description: { type: String, default: '' },
        plazaName: { type: String, default: 'Electronic City Toll Plaza' },
        timestamp: { type: Date, default: Date.now },
        balanceAfter: { type: Number, required: true },
        referenceId: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('FastagAccount', fastagAccountSchema);
