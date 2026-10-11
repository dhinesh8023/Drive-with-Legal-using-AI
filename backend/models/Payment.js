const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    fine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fine',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Google Pay', 'PhonePe', 'FASTag', 'NetBanking', 'Credit/Debit Card'],
      required: true,
    },
    transactionReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['INITIATED', 'PROCESSING', 'SUCCESS', 'FAILED', 'VERIFIED', 'REFUNDED'],
      default: 'INITIATED',
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'FLAGGED_ANOMALY', 'REJECTED'],
      default: 'PENDING',
    },
    verifiedBy: {
      type: String,
      default: 'SYSTEM_AUTOMATED_VERIFIER',
    },
    verifiedAt: {
      type: Date,
    },
    gatewayDetails: {
      mode: { type: String, default: 'demo' },
      upiId: String,
      fastagTxnId: String,
      gatewayResponseCode: String,
      ipAddress: String,
    },
    receiptGenerated: {
      type: Boolean,
      default: false,
    },
    receiptUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
