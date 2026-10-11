const Notification = require('../models/Notification');
const Fine = require('../models/Fine');
const User = require('../models/User');
const smsAdapter = require('./smsProviderAdapter');
const whatsappAdapter = require('./whatsappProviderAdapter');
const { generateId } = require('../utils/helpers');
const { recordAudit } = require('./auditService');

class NotificationService {
  /**
   * Dispatch escalating reminder
   * Level 1: In-App Notification
   * Level 2: SMS Workflow
   * Level 3: WhatsApp Workflow
   * Level 4: Final Overdue Alert
   */
  async sendFineReminder(fineId, requestedLevel = null) {
    const fine = await Fine.findById(fineId).populate('user');
    if (!fine) {
      throw new Error(`Fine ${fineId} not found`);
    }

    const user = fine.user;
    const phone = user?.phone || '+91-9876543210';
    const currentLevel = requestedLevel || (fine.notificationLevel + 1);
    const notificationId = generateId('NOTIF');

    let title = '';
    let message = '';
    let channel = 'IN_APP';
    let adapterResult = null;

    switch (currentLevel) {
      case 1:
        title = `Reminder (Level 1): Traffic Fine Pending (${fine.fineId})`;
        message = `A traffic violation fine of ₹${fine.fineAmount} for vehicle ${fine.vehicleNumber} is awaiting your payment before ${new Date(fine.dueDate).toLocaleDateString()}.`;
        channel = 'IN_APP';
        break;

      case 2:
        title = `Reminder (Level 2 - SMS): Pending E-Challan ${fine.fineId}`;
        message = `Drive Legal AI: Notice for ${fine.vehicleNumber}. Fine ₹${fine.fineAmount} for ${fine.violationType} due on ${new Date(fine.dueDate).toLocaleDateString()}. Pay at portal to avoid penalties.`;
        channel = 'SMS_SIMULATION';
        adapterResult = await smsAdapter.sendSms({ phone, message });
        break;

      case 3:
        title = `Reminder (Level 3 - WhatsApp): Urgent Notice ${fine.fineId}`;
        message = `Official notice for vehicle ${fine.vehicleNumber}. Pending fine of ₹${fine.fineAmount}. Due date: ${new Date(fine.dueDate).toLocaleDateString()}.`;
        channel = 'WHATSAPP_SIMULATION';
        adapterResult = await whatsappAdapter.sendWhatsAppMessage({
          phone,
          fineId: fine.fineId,
          amount: fine.fineAmount,
          dueDate: fine.dueDate,
          vehicleNumber: fine.vehicleNumber,
          violationType: fine.violationType,
        });
        break;

      case 4:
      default:
        title = `FINAL NOTICE (Level 4): Overdue Fine Escalation ${fine.fineId}`;
        message = `CRITICAL WARNING: Fine ${fine.fineId} for ${fine.vehicleNumber} is overdue. Continued non-payment may initiate registration suspension and license demerits.`;
        channel = 'WHATSAPP_SIMULATION';
        adapterResult = await whatsappAdapter.sendWhatsAppMessage({
          phone,
          fineId: fine.fineId,
          amount: fine.fineAmount,
          dueDate: fine.dueDate,
          vehicleNumber: fine.vehicleNumber,
          violationType: `FINAL OVERDUE WARNING - ${fine.violationType}`,
        });
        break;
    }

    // Save notification record
    const notif = await Notification.create({
      notificationId,
      user: user ? user._id : fine._id,
      fine: fine._id,
      channel,
      title,
      message,
      reminderLevel: currentLevel,
      status: 'DELIVERED',
      deliveryDetails: {
        recipientPhone: phone,
        gatewayResponseId: adapterResult?.messageId || adapterResult?.wamid || 'IN_APP_LOCAL',
      },
    });

    // Update fine metadata
    fine.notificationLevel = currentLevel;
    fine.lastNotificationSentAt = new Date();
    if (currentLevel >= 4 && fine.status === 'PENDING') {
      fine.status = 'OVERDUE';
    }
    await fine.save();

    await recordAudit({
      actorName: 'Notification Engine',
      actorRole: 'SYSTEM',
      action: 'NOTIFICATION_SENT',
      targetType: 'FINE',
      targetId: fine.fineId,
      details: { channel, reminderLevel: currentLevel, recipientPhone: phone },
    });

    return {
      success: true,
      notification: notif,
      channel,
      reminderLevel: currentLevel,
      adapterResult,
    };
  }
}

module.exports = new NotificationService();
