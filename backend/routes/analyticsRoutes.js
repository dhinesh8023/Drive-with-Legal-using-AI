const express = require('express');
const router = express.Router();
const {
  getDashboardAnalytics,
  getBlackspotsAnalytics,
  getNearMissesAnalytics,
  getRepeatOffenders,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

router.use(protect);

router.get('/dashboard', authorizeRoles('POLICE', 'GOVERNMENT_STAFF', 'ADMIN'), getDashboardAnalytics);
router.get('/blackspots', getBlackspotsAnalytics);
router.get('/near-misses', authorizeRoles('POLICE', 'GOVERNMENT_STAFF', 'ADMIN'), getNearMissesAnalytics);
router.get('/repeat-offenders', authorizeRoles('POLICE', 'GOVERNMENT_STAFF', 'ADMIN'), getRepeatOffenders);

module.exports = router;
