const express = require('express');
const router = express.Router();
const {
  startSession,
  updateSession,
  endSession,
  getSessionHistory,
  triggerEmergency,
} = require('../controllers/drivingController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/start', startSession);
router.post('/update', updateSession);
router.post('/end', endSession);
router.get('/history', getSessionHistory);
router.post('/emergency', triggerEmergency);

module.exports = router;
