const express = require("express");
const router = express.Router();
const violationController = require("../controllers/violationController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles, requireStaffApproval } = require("../middleware/rbacMiddleware");
const { ROLES } = require("../config/constants");

router.get("/", protect, violationController.listViolations);
router.post(
  "/",
  protect,
  allowRoles(ROLES.POLICE, ROLES.ADMIN),
  requireStaffApproval,
  violationController.createViolation
);
router.get("/:id", protect, violationController.getViolation);

router.post(
  "/:id/review",
  protect,
  allowRoles(ROLES.POLICE, ROLES.ADMIN),
  requireStaffApproval,
  violationController.reviewViolation
);
router.post(
  "/:id/approve",
  protect,
  allowRoles(ROLES.POLICE, ROLES.ADMIN),
  requireStaffApproval,
  (req, res, next) => {
    req.body.decision = "APPROVED";
    next();
  },
  violationController.reviewViolation
);
router.post(
  "/:id/reject",
  protect,
  allowRoles(ROLES.POLICE, ROLES.ADMIN),
  requireStaffApproval,
  (req, res, next) => {
    req.body.decision = "REJECTED";
    next();
  },
  violationController.reviewViolation
);

module.exports = router;
