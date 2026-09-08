const express = require("express");
const router = express.Router();
const fineController = require("../controllers/fineController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles, requireStaffApproval } = require("../middleware/rbacMiddleware");
const { ROLES } = require("../config/constants");

router.get("/", protect, fineController.listFines);
router.post(
  "/",
  protect,
  allowRoles(ROLES.POLICE, ROLES.ADMIN),
  requireStaffApproval,
  fineController.createFine
);
router.get("/:id", protect, fineController.getFine);
router.put("/:id", protect, allowRoles(ROLES.POLICE, ROLES.ADMIN), requireStaffApproval, fineController.updateFine);

router.post(
  "/:id/remind",
  protect,
  allowRoles(ROLES.POLICE, ROLES.GOVERNMENT_STAFF, ROLES.ADMIN),
  requireStaffApproval,
  fineController.remindFine
);
router.post(
  "/:id/cancel",
  protect,
  allowRoles(ROLES.ADMIN),
  fineController.cancelFine
);

module.exports = router;
