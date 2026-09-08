const express = require("express");
const router = express.Router();
const fastagController = require("../controllers/fastagController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, fastagController.getMyFastag);
router.post("/link", protect, fastagController.linkFastag);
router.post("/recharge", protect, fastagController.rechargeFastag);
router.get("/transactions/:accountId", protect, fastagController.listTransactions);
router.post("/pay-fine", protect, fastagController.payFineWithFastag);

module.exports = router;
