const express = require("express");
const router = express.Router();
const blackspotController = require("../controllers/blackspotController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/rbacMiddleware");
const { ROLES } = require("../config/constants");

router.get("/", protect, blackspotController.listBlackspots);
router.post(
  "/recalculate",
  protect,
  allowRoles(ROLES.POLICE, ROLES.GOVERNMENT_STAFF, ROLES.ADMIN),
  blackspotController.recalculateBlackspot
);

module.exports = router;
