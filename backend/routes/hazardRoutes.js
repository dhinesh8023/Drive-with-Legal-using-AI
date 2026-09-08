const express = require("express");
const router = express.Router();
const hazardController = require("../controllers/hazardController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, hazardController.listHazards);
router.post("/", protect, hazardController.createHazard);
router.get("/nearby", protect, hazardController.nearbyHazards);

module.exports = router;
