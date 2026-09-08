const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/rbacMiddleware");
const { ROLES } = require("../config/constants");

router.get("/", protect, notificationController.listNotifications);
router.post("/send", protect, allowRoles(ROLES.ADMIN, ROLES.GOVERNMENT_STAFF), notificationController.sendNotification);
router.post("/:id/read", protect, notificationController.markRead);

module.exports = router;
