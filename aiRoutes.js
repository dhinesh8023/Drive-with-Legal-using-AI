const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

router.post("/analyze", protect, aiController.analyze);
router.post("/risk-prediction", protect, aiController.riskPrediction);
router.post("/driver-monitor", protect, aiController.driverMonitor);
router.post("/road-detection", protect, aiController.roadDetection);
router.post("/collision-risk", protect, aiController.collisionRisk);
router.post("/violation-detection", protect, aiController.violationDetection);

module.exports = router;
