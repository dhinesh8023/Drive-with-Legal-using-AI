const Notification = require('../models/Notification');
const { generateId } = require('../utils/helpers');

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate('fine')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

    res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send custom in-app / simulated notification
 * @route   POST /api/notifications/send
 */
const sendNotification = async (req, res, next) => {
  try {
    const { userId, title, message, channel = 'IN_APP', fineId } = req.body;

    const notif = await Notification.create({
      notificationId: generateId('NOTIF'),
      user: userId || req.user._id,
      fine: fineId,
      channel,
      title,
      message,
      reminderLevel: 1,
      status: 'DELIVERED',
    });

    res.status(201).json({
      success: true,
      message: 'Notification delivered',
      data: notif,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark notification as read
 * @route   POST /api/notifications/:id/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notif,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  sendNotification,
  markAsRead,
};
