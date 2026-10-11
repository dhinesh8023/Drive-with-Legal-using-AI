const express = require('express');
const router = express.Router();
const {
  getFines,
  getFineById,
  sendReminder,
  cancelFine,
  getFineRules,
  saveFineRule,
} = require('../controllers/fineController');
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

router.use(protect);

router.get('/rules', getFineRules);
router.post('/rules', authorizeRoles('ADMIN', 'GOVERNMENT_STAFF'), saveFineRule);

router.get('/', getFines);
router.get('/:id', getFineById);
router.post('/:id/remind', authorizeRoles('POLICE', 'ADMIN'), sendReminder);
router.post('/:id/cancel', authorizeRoles('POLICE', 'ADMIN', 'GOVERNMENT_STAFF'), cancelFine);

module.exports = router;
