const Notification = require("../models/Notification");
const { success, error } = require("../utils/apiResponse");
const { AUDIT_ACTIONS } = require("../config/constants");

async function listNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate("fine", "fineCode amount status")
      .sort({ createdAt: -1 })
      .limit(100);
    return success(res, 200, "Notifications fetched.", { notifications, count: notifications.length });
  } catch (err) {
    next(err);
  }
}

/** Manual send — e.g. admin broadcasting an in-app notice. */
async function sendNotification(req, res, next) {
  try {
    const { userId, channel, subject, message } = req.body;
    const notification = await Notification.create({
      user: userId,
      channel,
      subject,
      message,
      status: "SENT",
      isDemo: true,
      sentAt: new Date(),
    });

    if (req.logAudit) {
      await req.logAudit({ action: AUDIT_ACTIONS.NOTIFICATION_SENT, targetType: "Notification", targetId: notification._id });
    }

    return success(res, 201, "Notification sent.", { notification });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return error(res, 404, "Notification not found.");
    if (notification.user.toString() !== req.user._id.toString()) return error(res, 403, "Forbidden.");

    notification.isRead = true;
    await notification.save();
    return success(res, 200, "Notification marked as read.", { notification });
  } catch (err) {
    next(err);
  }
}

module.exports = { listNotifications, sendNotification, markRead };
