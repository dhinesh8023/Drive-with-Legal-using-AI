const mongoose = require('mongoose');

const fineSchema = new mongoose.Schema(
  {
    fineId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    violation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Violation',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: false,
    },
    vehicleNumber: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    violationType: {
      type: String,
      required: true,
    },
    fineRule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FineRule',
      required: true,
    },
    fineAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'OVERDUE', 'DISPUTED', 'UNDER_REVIEW', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PROCESSING', 'PAID', 'REFUNDED'],
      default: 'UNPAID',
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    issuedByOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notificationLevel: {
      type: Number,
      default: 0, // 0: None, 1: App, 2: SMS, 3: WhatsApp, 4: Overdue Alert
    },
    lastNotificationSentAt: {
      type: Date,
    },
    disputeReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Fine', fineSchema);
