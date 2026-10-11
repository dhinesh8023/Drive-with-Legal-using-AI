const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    notificationId: {
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
    fine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fine',
    },
    channel: {
      type: String,
      enum: ['IN_APP', 'SMS_SIMULATION', 'WHATSAPP_SIMULATION', 'EMAIL_SIMULATION', 'REAL_SMS', 'REAL_WHATSAPP'],
      default: 'IN_APP',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    reminderLevel: {
      type: Number,
      default: 1, // 1: First In-App, 2: SMS, 3: WhatsApp, 4: Overdue Alert
    },
    status: {
      type: String,
      enum: ['SENT', 'DELIVERED', 'READ', 'FAILED'],
      default: 'DELIVERED',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    deliveryDetails: {
      recipientPhone: String,
      templateName: String,
      gatewayResponseId: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
