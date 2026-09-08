const express = require("express");
const router = express.Router();
const receiptController = require("../controllers/receiptController");
const { protect } = require("../middleware/authMiddleware");

router.get("/:fineId", protect, receiptController.downloadReceipt);

module.exports = router;
