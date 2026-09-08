const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicleController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, vehicleController.listVehicles);
router.post("/", protect, vehicleController.createVehicle);
router.get("/:id", protect, vehicleController.getVehicle);
router.put("/:id", protect, vehicleController.updateVehicle);
router.delete("/:id", protect, vehicleController.deleteVehicle);

module.exports = router;
