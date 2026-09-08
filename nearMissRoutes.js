const express = require("express");
const router = express.Router();
const nearMissController = require("../controllers/nearMissController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, nearMissController.listNearMisses);
router.post("/", protect, nearMissController.createNearMiss);

module.exports = router;
