const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, paymentController.listPayments);
router.post("/create", protect, paymentController.createPayment);
router.post("/verify", protect, paymentController.verifyPaymentController);
router.get("/:id", protect, paymentController.getPayment);

module.exports = router;
