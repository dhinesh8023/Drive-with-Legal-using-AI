const express = require("express");
const router = express.Router();
const fineRuleController = require("../controllers/fineRuleController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/rbacMiddleware");
const { ROLES } = require("../config/constants");

router.get("/", protect, fineRuleController.listFineRules);
router.post("/", protect, allowRoles(ROLES.ADMIN), fineRuleController.upsertFineRule);
router.delete("/:id", protect, allowRoles(ROLES.ADMIN), fineRuleController.deleteFineRule);

module.exports = router;
