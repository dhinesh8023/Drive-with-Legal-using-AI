const express = require('express');
const router = express.Router();
const {
  getViolations,
  createViolationCandidate,
  getViolationById,
  reviewViolation,
  approveViolation,
  rejectViolation,
} = require('../controllers/violationController');
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

router.use(protect);

router.get('/', getViolations);
router.post('/', createViolationCandidate);
router.get('/:id', getViolationById);

// Official Police/Admin Review endpoints
router.post('/:id/review', authorizeRoles('POLICE', 'ADMIN'), reviewViolation);
router.post('/:id/approve', authorizeRoles('POLICE', 'ADMIN'), approveViolation);
router.post('/:id/reject', authorizeRoles('POLICE', 'ADMIN'), rejectViolation);

module.exports = router;
