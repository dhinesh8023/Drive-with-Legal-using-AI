const express = require('express');
const router = express.Router();
const {
  getPayments,
  initiatePayment,
  verifyPayment,
  getPaymentById,
  downloadReceipt,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getPayments);
router.post('/create', initiatePayment);
router.post('/verify', verifyPayment);
router.get('/receipt/:fineId', downloadReceipt);
router.get('/:id', getPaymentById);

module.exports = router;
