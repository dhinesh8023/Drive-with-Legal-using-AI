const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/rbacMiddleware");
const { ROLES } = require("../config/constants");

const staffOnly = allowRoles(ROLES.POLICE, ROLES.GOVERNMENT_STAFF, ROLES.ADMIN);

router.get("/dashboard", protect, staffOnly, analyticsController.dashboardSummary);
router.get("/violations", protect, staffOnly, analyticsController.violationAnalytics);
router.get("/payments", protect, staffOnly, analyticsController.paymentAnalytics);
router.get("/near-misses", protect, staffOnly, analyticsController.nearMissAnalytics);
router.get("/blackspots", protect, staffOnly, analyticsController.blackspotAnalytics);

module.exports = router;
