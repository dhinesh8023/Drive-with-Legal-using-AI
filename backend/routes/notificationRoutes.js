const express = require('express');
const router = express.Router();
const {
  getNotifications,
  sendNotification,
  markAsRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getNotifications);
router.post('/send', sendNotification);
router.post('/:id/read', markAsRead);

module.exports = router;
