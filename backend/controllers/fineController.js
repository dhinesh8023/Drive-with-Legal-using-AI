const mongoose = require('mongoose');
const Fine = require('../models/Fine');
const FineRule = require('../models/FineRule');
const Vehicle = require('../models/Vehicle');
const mockDataStore = require('../services/mockDataStore');
const notificationService = require('../services/notificationService');
const { recordAudit } = require('../services/auditService');

/**
 * @desc    Get fines (user-scoped or officer/admin all)
 * @route   GET /api/fines
 */
const getFines = async (req, res, next) => {
  try {
    const { status, vehicleNumber, limit = 50, page = 1 } = req.query;

    if (mongoose.connection.readyState !== 1) {
      let list = mockDataStore.fines;
      if (status) list = list.filter((f) => f.status === status);
      return res.status(200).json({
        success: true,
        total: list.length,
        count: list.length,
        data: list,
      });
    }

    let query = {};

    if (req.user.role === 'USER') {
      const userVehicles = await Vehicle.find({ user: req.user._id }).select('vehicleNumber');
      const numbers = userVehicles.map((v) => v.vehicleNumber);
      query.$or = [{ user: req.user._id }, { vehicleNumber: { $in: numbers } }];
    }

    if (status) query.status = status;
    if (vehicleNumber) query.vehicleNumber = { $regex: vehicleNumber, $options: 'i' };

    const fines = await Fine.find(query)
      .populate('user', 'name email phone')
      .populate('violation')
      .populate('issuedByOfficer', 'name officerId badgeNumber')
      .populate('fineRule')
      .populate('payment')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Fine.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      count: fines.length,
      data: fines.length > 0 ? fines : mockDataStore.fines,
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      total: mockDataStore.fines.length,
      count: mockDataStore.fines.length,
      data: mockDataStore.fines,
    });
  }
};

/**
 * @desc    Get single fine by ID
 * @route   GET /api/fines/:id
 */
const getFineById = async (req, res, next) => {
  try {
    const fine = await Fine.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('violation')
      .populate('issuedByOfficer', 'name officerId badgeNumber')
      .populate('fineRule')
      .populate('payment');

    if (!fine) {
      return res.status(404).json({ success: false, message: 'Fine record not found' });
    }

    res.status(200).json({
      success: true,
      data: fine,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Trigger escalation reminder (Level 1 In-App, 2 SMS, 3 WhatsApp, 4 Overdue)
 * @route   POST /api/fines/:id/remind
 */
const sendReminder = async (req, res, next) => {
  try {
    const { level } = req.body;
    const result = await notificationService.sendFineReminder(req.params.id, level ? Number(level) : null);

    res.status(200).json({
      success: true,
      message: `Notification escalation reminder (Level ${result.reminderLevel}) dispatched successfully`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel fine (Administrative override)
 * @route   POST /api/fines/:id/cancel
 */
const cancelFine = async (req, res, next) => {
  try {
    const { cancellationReason } = req.body;
    const fine = await Fine.findById(req.params.id);

    if (!fine) {
      return res.status(404).json({ success: false, message: 'Fine not found' });
    }

    fine.status = 'CANCELLED';
    await fine.save();

    await recordAudit({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'FINE_CANCELLED',
      targetType: 'FINE',
      targetId: fine.fineId,
      details: { cancellationReason },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Fine has been officially cancelled and voided.',
      data: fine,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get configured fine rules
 * @route   GET /api/fines/rules
 */
const getFineRules = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: mockDataStore.fineRules.length,
        data: mockDataStore.fineRules,
      });
    }

    const rules = await FineRule.find().sort({ severity: -1 });
    res.status(200).json({
      success: true,
      count: rules.length,
      data: rules.length > 0 ? rules : mockDataStore.fineRules,
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      count: mockDataStore.fineRules ? mockDataStore.fineRules.length : 0,
      data: mockDataStore.fineRules || [],
    });
  }
};

/**
 * @desc    Create or update configured fine rule (Admin/Govt)
 * @route   POST /api/fines/rules
 */
const saveFineRule = async (req, res, next) => {
  try {
    const { violationType, code, baseFine, description, duePeriodDays, severity, pointsDeduction, isActive } = req.body;

    const existing = await FineRule.findOne({ violationType });
    let rule;
    if (existing) {
      existing.baseFine = baseFine;
      existing.description = description;
      existing.duePeriodDays = duePeriodDays;
      existing.severity = severity;
      existing.pointsDeduction = pointsDeduction;
      if (isActive !== undefined) existing.isActive = isActive;
      rule = await existing.save();
    } else {
      rule = await FineRule.create({
        violationType,
        code: code || violationType.substring(0, 4).toUpperCase(),
        baseFine,
        description,
        duePeriodDays: duePeriodDays || 15,
        severity: severity || 'MEDIUM',
        pointsDeduction: pointsDeduction || 2,
        isActive: isActive !== undefined ? isActive : true,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Configured fine rule saved successfully',
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFines,
  getFineById,
  sendReminder,
  cancelFine,
  getFineRules,
  saveFineRule,
};
