const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/rbacMiddleware");
const { ROLES } = require("../config/constants");

router.get("/", protect, allowRoles(ROLES.ADMIN), userController.listUsers);
router.get(
  "/search",
  protect,
  allowRoles(ROLES.POLICE, ROLES.GOVERNMENT_STAFF, ROLES.ADMIN),
  userController.searchUsers
);
router.get("/:id", protect, userController.getUserById);
router.put("/:id", protect, userController.updateUser);

module.exports = router;
