const Vehicle = require("../models/Vehicle");
const { success, error } = require("../utils/apiResponse");
const { ROLES } = require("../config/constants");

async function listVehicles(req, res, next) {
  try {
    const filter = req.user.role === ROLES.USER ? { owner: req.user._id } : {};
    const vehicles = await Vehicle.find(filter).populate("owner", "name email phone");
    return success(res, 200, "Vehicles fetched.", { vehicles, count: vehicles.length });
  } catch (err) {
    next(err);
  }
}

async function createVehicle(req, res, next) {
  try {
    const { vehicleNumber, vehicleType, brand, model, year, fastagId, insurance, registration } = req.body;

    if (!vehicleNumber || !vehicleType) {
      return error(res, 400, "Vehicle number and vehicle type are required.");
    }

    const existing = await Vehicle.findOne({ vehicleNumber: vehicleNumber.toUpperCase() });
    if (existing) return error(res, 409, "A vehicle with this number is already registered.");

    const vehicle = await Vehicle.create({
      owner: req.user._id,
      vehicleNumber: vehicleNumber.toUpperCase(),
      vehicleType,
      brand,
      model,
      year,
      fastagId,
      insurance,
      registration,
    });

    return success(res, 201, "Vehicle registered.", { vehicle });
  } catch (err) {
    next(err);
  }
}

async function getVehicle(req, res, next) {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate("owner", "name email phone");
    if (!vehicle) return error(res, 404, "Vehicle not found.");

    if (req.user.role === ROLES.USER && vehicle.owner._id.toString() !== req.user._id.toString()) {
      return error(res, 403, "Forbidden.");
    }

    return success(res, 200, "Vehicle fetched.", { vehicle });
  } catch (err) {
    next(err);
  }
}

async function updateVehicle(req, res, next) {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return error(res, 404, "Vehicle not found.");

    if (req.user.role === ROLES.USER && vehicle.owner.toString() !== req.user._id.toString()) {
      return error(res, 403, "Forbidden.");
    }

    const editableFields = ["brand", "model", "year", "fastagId", "insurance", "registration", "isActive"];
    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) vehicle[field] = req.body[field];
    });

    await vehicle.save();
    return success(res, 200, "Vehicle updated.", { vehicle });
  } catch (err) {
    next(err);
  }
}

async function deleteVehicle(req, res, next) {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return error(res, 404, "Vehicle not found.");

    if (req.user.role === ROLES.USER && vehicle.owner.toString() !== req.user._id.toString()) {
      return error(res, 403, "Forbidden.");
    }

    await vehicle.deleteOne();
    return success(res, 200, "Vehicle removed.");
  } catch (err) {
    next(err);
  }
}

module.exports = { listVehicles, createVehicle, getVehicle, updateVehicle, deleteVehicle };
