const express = require('express');
const router = express.Router();
const {
  getDisputes,
  createDispute,
  reviewDispute,
} = require('../controllers/disputeController');
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

router.use(protect);

router.get('/', getDisputes);
router.post('/', createDispute);
router.post('/:id/review', authorizeRoles('POLICE', 'ADMIN'), reviewDispute);

module.exports = router;
