const express = require("express");
const router = express.Router();
const emergencyController = require("../controllers/emergencyController");
const { protect } = require("../middleware/authMiddleware");

router.post("/detect", protect, emergencyController.detectEmergency);
router.post("/:id/respond", protect, emergencyController.respondToEmergency);
router.get("/", protect, emergencyController.listMyEmergencies);

module.exports = router;
