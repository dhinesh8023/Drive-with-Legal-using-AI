const mongoose = require("mongoose");
const {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUS,
  REMINDER_LEVELS,
} = require("../config/constants");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fine: { type: mongoose.Schema.Types.ObjectId, ref: "Fine" },

    channel: { type: String, enum: Object.values(NOTIFICATION_CHANNELS), required: true },
    reminderLevel: { type: String, enum: Object.values(REMINDER_LEVELS) },

    subject: { type: String, trim: true },
    message: { type: String, required: true, trim: true },

    status: {
      type: String,
      enum: Object.values(NOTIFICATION_STATUS),
      default: NOTIFICATION_STATUS.QUEUED,
      index: true,
    },

    isDemo: { type: Boolean, default: true },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    failureReason: { type: String },

    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
