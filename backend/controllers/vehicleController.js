const Vehicle = require('../models/Vehicle');
const FastagAccount = require('../models/FastagAccount');
const { generateId } = require('../utils/helpers');

/**
 * @desc    Get vehicles (for logged in user, or all for police/admin)
 * @route   GET /api/vehicles
 */
const getVehicles = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'USER') {
      query.user = req.user._id;
    } else if (req.query.userId) {
      query.user = req.query.userId;
    }

    const vehicles = await Vehicle.find(query).populate('user', 'name email phone').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a new vehicle
 * @route   POST /api/vehicles
 */
const addVehicle = async (req, res, next) => {
  try {
    const { vehicleNumber, vehicleType, brand, model, year, color, fastagId, insuranceNumber, rcNumber } = req.body;

    const existing = await Vehicle.findOne({ vehicleNumber: vehicleNumber.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A vehicle with this registration number is already registered in the registry.',
      });
    }

    const assignedFastag = fastagId || `NETC-${vehicleNumber.toUpperCase().replace(/\s+/g, '')}`;

    const vehicle = await Vehicle.create({
      user: req.user._id,
      vehicleNumber: vehicleNumber.toUpperCase().trim(),
      vehicleType: vehicleType || 'Car',
      brand: brand || 'Generic Brand',
      model: model || 'Model X',
      year: year || new Date().getFullYear(),
      color: color || 'Silver',
      fastagId: assignedFastag,
      insuranceNumber: insuranceNumber || `INS-${Date.now().toString().slice(-6)}`,
      rcNumber: rcNumber || `RC-${vehicleNumber.toUpperCase().replace(/\s+/g, '')}`,
    });

    // Auto-create Demo FASTag account if not existing
    const existingTag = await FastagAccount.findOne({ vehicle: vehicle._id });
    if (!existingTag) {
      await FastagAccount.create({
        fastagId: assignedFastag,
        user: req.user._id,
        vehicle: vehicle._id,
        vehicleNumber: vehicle.vehicleNumber,
        currentBalance: 2500,
        transactions: [
          {
            transactionId: generateId('FTX'),
            type: 'WALLET_RECHARGE',
            amount: 2500,
            description: 'Initial Onboarding Wallet Credit',
            plazaName: 'NETC National Switch Onboarding',
            balanceAfter: 2500,
          },
        ],
      });
    }

    res.status(201).json({
      success: true,
      message: 'Vehicle registered and FASTag wallet linked successfully',
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single vehicle details
 * @route   GET /api/vehicles/:id
 */
const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('user', 'name email phone');
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle record not found',
      });
    }

    if (req.user.role === 'USER' && vehicle.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to vehicle record.',
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update vehicle
 * @route   PUT /api/vehicles/:id
 */
const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    if (req.user.role === 'USER' && vehicle.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized modification' });
    }

    const updated = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({
      success: true,
      message: 'Vehicle information updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete vehicle
 * @route   DELETE /api/vehicles/:id
 */
const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    if (req.user.role === 'USER' && vehicle.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized removal' });
    }

    await Vehicle.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Vehicle deleted from your profile',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVehicles,
  addVehicle,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
};
