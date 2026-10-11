const express = require('express');
const router = express.Router();
const {
  analyze,
  predictRisk,
  driverMonitor,
  roadDetection,
  collisionRisk,
  violationDetection,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// Allow telemetry and analysis
router.post('/analyze', analyze);
router.post('/risk-prediction', predictRisk);
router.post('/driver-monitor', driverMonitor);
router.post('/road-detection', roadDetection);
router.post('/collision-risk', collisionRisk);
router.post('/violation-detection', violationDetection);

module.exports = router;
