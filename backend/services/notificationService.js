const Notification = require("../models/Notification");
const { sendSms } = require("./smsProviderAdapter");
const { sendWhatsApp } = require("./whatsappProviderAdapter");
const {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUS,
  REMINDER_LEVELS,
} = require("../config/constants");

/**
 * Escalating fine reminder workflow:
 *   FIRST  -> in-app only
 *   SECOND -> SMS
 *   THIRD  -> WhatsApp
 *   FINAL  -> overdue alert (in-app + SMS)
 *
 * Never sends more than one reminder per level per fine — callers should
 * check Fine.notificationStatus.lastReminderLevel before escalating.
 */

function buildFineMessage(fine, user) {
  return (
    `Drive Legal AI\n\n` +
    `You have a pending fine.\n\n` +
    `Fine ID: ${fine.fineCode}\n` +
    `Amount: \u20b9${fine.amount}\n` +
    `Due Date: ${new Date(fine.dueDate).toDateString()}\n\n` +
    `Please review and complete payment through the application.`
  );
}

async function sendReminder({ fine, user, level }) {
  const message = buildFineMessage(fine, user);
  const results = [];

  if (level === REMINDER_LEVELS.FIRST) {
    results.push(await recordAndSend({ user, fine, channel: NOTIFICATION_CHANNELS.IN_APP, level, message }));
  } else if (level === REMINDER_LEVELS.SECOND) {
    results.push(await recordAndSend({ user, fine, channel: NOTIFICATION_CHANNELS.SMS, level, message }));
  } else if (level === REMINDER_LEVELS.THIRD) {
    results.push(await recordAndSend({ user, fine, channel: NOTIFICATION_CHANNELS.WHATSAPP, level, message }));
  } else if (level === REMINDER_LEVELS.FINAL) {
    results.push(
      await recordAndSend({ user, fine, channel: NOTIFICATION_CHANNELS.IN_APP, level, message: `OVERDUE: ${message}` })
    );
    results.push(
      await recordAndSend({ user, fine, channel: NOTIFICATION_CHANNELS.SMS, level, message: `OVERDUE: ${message}` })
    );
  }

  fine.notificationStatus = { lastReminderLevel: level, lastSentAt: new Date() };
  await fine.save();

  return results;
}

async function recordAndSend({ user, fine, channel, level, message }) {
  const notification = await Notification.create({
    user: user._id,
    fine: fine._id,
    channel,
    reminderLevel: level,
    subject: "Drive Legal AI - Fine Reminder",
    message,
    status: NOTIFICATION_STATUS.QUEUED,
  });

  try {
    let providerResult;
    if (channel === NOTIFICATION_CHANNELS.SMS) {
      providerResult = await sendSms({ toPhone: user.phone, message });
    } else if (channel === NOTIFICATION_CHANNELS.WHATSAPP) {
      providerResult = await sendWhatsApp({ toPhone: user.phone, message });
    } else {
      providerResult = { success: true, isDemo: true, status: "SENT" };
    }

    notification.status = providerResult.success ? NOTIFICATION_STATUS.SENT : NOTIFICATION_STATUS.FAILED;
    notification.isDemo = providerResult.isDemo !== false;
    notification.sentAt = new Date();
    if (!providerResult.success) notification.failureReason = providerResult.reason;
    await notification.save();
  } catch (err) {
    notification.status = NOTIFICATION_STATUS.FAILED;
    notification.failureReason = err.message;
    await notification.save();
  }

  return notification;
}

module.exports = { sendReminder, buildFineMessage };
