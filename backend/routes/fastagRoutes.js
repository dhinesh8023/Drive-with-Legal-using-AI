const express = require('express');
const router = express.Router();
const {
  getFastag,
  linkFastag,
  rechargeFastag,
  getTransactions,
} = require('../controllers/fastagController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getFastag);
router.post('/link', linkFastag);
router.post('/recharge', rechargeFastag);
router.get('/transactions', getTransactions);

module.exports = router;
