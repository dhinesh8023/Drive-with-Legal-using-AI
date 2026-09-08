const express = require("express");
const router = express.Router();
const disputeController = require("../controllers/disputeController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles, requireStaffApproval } = require("../middleware/rbacMiddleware");
const { ROLES } = require("../config/constants");

router.get("/", protect, disputeController.listDisputes);
router.post("/", protect, allowRoles(ROLES.USER), disputeController.createDispute);
router.post(
  "/:id/review",
  protect,
  allowRoles(ROLES.POLICE, ROLES.ADMIN),
  requireStaffApproval,
  disputeController.reviewDispute
);

module.exports = router;
