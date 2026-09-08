const express = require("express");
const router = express.Router();
const drivingController = require("../controllers/drivingController");
const { protect } = require("../middleware/authMiddleware");

router.post("/start", protect, drivingController.startSession);
router.post("/update", protect, drivingController.updateSession); // expects { sessionId, ...telemetry }
router.post("/end", protect, drivingController.endSession); // expects { sessionId }
router.get("/history", protect, drivingController.getHistory);

// Convenience REST-style variants, also supported:
router.post("/:id/update", protect, drivingController.updateSession);
router.post("/:id/end", protect, drivingController.endSession);

module.exports = router;
