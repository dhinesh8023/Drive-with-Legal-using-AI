const mongoose = require('mongoose');
const Violation = require('../models/Violation');
const Vehicle = require('../models/Vehicle');
const Fine = require('../models/Fine');
const FineRule = require('../models/FineRule');
const User = require('../models/User');
const mockDataStore = require('../services/mockDataStore');
const notificationService = require('../services/notificationService');
const fraudService = require('../services/fraudDetectionService');
const { recordAudit } = require('../services/auditService');
const { generateId, getDueDate } = require('../utils/helpers');

/**
 * @desc    Get violations (filtered by role or user)
 * @route   GET /api/violations
 */
const getViolations = async (req, res, next) => {
  try {
    const { reviewStatus, vehicleNumber, violationType, limit = 50, page = 1 } = req.query;

    if (mongoose.connection.readyState !== 1) {
      let list = mockDataStore.violations;
      if (reviewStatus) list = list.filter((v) => v.status === reviewStatus || v.reviewStatus === reviewStatus);
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

    if (reviewStatus) query.reviewStatus = reviewStatus;
    if (vehicleNumber) query.vehicleNumber = { $regex: vehicleNumber, $options: 'i' };
    if (violationType) query.violationType = violationType;

    const violations = await Violation.find(query)
      .populate('user', 'name email phone')
      .populate('vehicle')
      .populate('reviewedBy', 'name officerId')
      .populate('fine')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Violation.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      count: violations.length,
      data: violations.length > 0 ? violations : mockDataStore.violations,
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      total: mockDataStore.violations.length,
      count: mockDataStore.violations.length,
      data: mockDataStore.violations,
    });
  }
};

/**
 * @desc    Create an AI-assisted violation candidate
 * @route   POST /api/violations
 */
const createViolationCandidate = async (req, res, next) => {
  try {
    const {
      vehicleNumber,
      violationType,
      location,
      latitude,
      longitude,
      evidenceImage,
      evidenceVideoRef,
      aiConfidence,
      riskScore,
      detectionSource,
      aiAnalysisDetails,
    } = req.body;

    const cleanVehicleNumber = vehicleNumber.toUpperCase().trim();

    if (mongoose.connection.readyState !== 1) {
      const violationId = generateId('VIO');
      const newVio = {
        _id: 'vio_' + Date.now(),
        violationId,
        vehicleNumber: cleanVehicleNumber,
        violationType,
        location: location || 'Outer Ring Road Expressway - KM 18',
        latitude: latitude || 12.9279,
        longitude: longitude || 80.1271,
        evidenceImage: evidenceImage || '/assets/evidence/default_violation.jpg',
        aiConfidence: aiConfidence || 94,
        riskScore: riskScore || 82,
        detectionSource: detectionSource || 'In-Vehicle Real CV Optical Sensor',
        status: 'PENDING_REVIEW',
        reviewStatus: 'PENDING',
        isAiAssisted: true,
        createdAt: new Date().toISOString(),
      };
      mockDataStore.violations.unshift(newVio);

      const io = req.app.get('socketio');
      if (io) {
        io.emit('violation_detected', newVio);
      }

      return res.status(201).json({
        success: true,
        message: 'AI violation candidate captured. Submitted for official officer review.',
        data: newVio,
      });
    }

    // Check duplicate anomaly
    const anomalyCheck = await fraudService.checkViolationAnomaly({
      vehicleNumber: cleanVehicleNumber,
      violationType,
      latitude: latitude || 12.9716,
      longitude: longitude || 77.5946,
      timestamp: new Date(),
    });

    if (anomalyCheck.isDuplicate) {
      return res.status(200).json({
        success: true,
        message: 'Duplicate candidate detected within 5-minute threshold. Candidate merged.',
        data: { originalViolationId: anomalyCheck.originalViolationId, duplicateFlag: true },
      });
    }

    // Attempt to resolve registered vehicle and user
    const vehicle = await Vehicle.findOne({ vehicleNumber: cleanVehicleNumber }).populate('user');
    const user = vehicle ? vehicle.user : null;

    const violationId = generateId('VIO');

    const violation = await Violation.create({
      violationId,
      user: user ? user._id : null,
      vehicle: vehicle ? vehicle._id : null,
      vehicleNumber: cleanVehicleNumber,
      violationType,
      location: location || 'Highway Junction Point 4',
      latitude: latitude || 12.9716,
      longitude: longitude || 77.5946,
      evidenceImage: evidenceImage || '/assets/evidence/default_violation.jpg',
      evidenceVideoRef: evidenceVideoRef || '',
      aiConfidence: aiConfidence || 89,
      riskScore: riskScore || 75,
      detectionSource: detectionSource || 'AI Smart Camera',
      aiAnalysisDetails: aiAnalysisDetails || {},
      reviewStatus: 'PENDING', // STRICT LEGAL COMPLIANCE: Must start in PENDING
      isAiAssisted: true,
    });

    await recordAudit({
      actorName: detectionSource || 'AI Edge Camera',
      actorRole: 'SYSTEM',
      action: 'VIOLATION_CANDIDATE_CAPTURED',
      targetType: 'VIOLATION',
      targetId: violationId,
      details: { vehicleNumber: cleanVehicleNumber, violationType, aiConfidence },
      req,
    });

    // Notify connected Socket.IO clients of new candidate
    const io = req.app.get('socketio');
    if (io) {
      io.emit('violation_detected', {
        violationId: violation.violationId,
        vehicleNumber: violation.vehicleNumber,
        violationType: violation.violationType,
        location: violation.location,
        aiConfidence: violation.aiConfidence,
        timestamp: violation.createdAt,
      });
    }

    res.status(201).json({
      success: true,
      message: 'AI violation candidate captured. Submitted for official officer review.',
      data: violation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single violation details
 * @route   GET /api/violations/:id
 */
const getViolationById = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const vio = mockDataStore.violations.find((v) => v._id === req.params.id || v.violationId === req.params.id) || mockDataStore.violations[0];
      return res.status(200).json({
        success: true,
        data: vio,
      });
    }

    const violation = await Violation.findById(req.params.id)
      .populate('user', 'name email phone driverScore')
      .populate('vehicle')
      .populate('reviewedBy', 'name officerId department')
      .populate('fine');

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: 'Violation record not found',
      });
    }

    // Audit Officer View
    if (req.user.role === 'POLICE' || req.user.role === 'GOVERNMENT_STAFF') {
      await recordAudit({
        actorId: req.user._id,
        actorName: req.user.name,
        actorRole: req.user.role,
        action: 'VIOLATION_VIEWED',
        targetType: 'VIOLATION',
        targetId: violation.violationId,
        req,
      });
    }

    res.status(200).json({
      success: true,
      data: violation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Officer Approves Violation & Generates Official Fine Ticket
 * @route   POST /api/violations/:id/approve
 */
const approveViolation = async (req, res, next) => {
  try {
    const { fineRuleId, officerNotes, customFineAmount, dueDays = 15 } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const vio = mockDataStore.violations.find((v) => v._id === req.params.id || v.violationId === req.params.id) || mockDataStore.violations[0];
      vio.status = 'APPROVED';
      vio.reviewStatus = 'APPROVED';
      vio.officerNotes = officerNotes || 'Violation validated by reviewing officer against photographic telemetry evidence.';

      const fineId = 'DL-' + Date.now().toString().slice(-6);
      const newFine = {
        _id: 'fine_' + Date.now(),
        fineId,
        violationId: vio.violationId,
        userId: '6ac8f3d710484a3e71b2146b',
        vehicleNumber: vio.vehicleNumber,
        violationType: vio.violationType,
        fineAmount: customFineAmount || 1500,
        status: 'PENDING',
        dueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
        location: vio.location,
        issuedAt: new Date().toISOString(),
        description: `Official fine issued for ${vio.violationType} by reviewing officer.`,
      };
      mockDataStore.fines.unshift(newFine);

      const io = req.app.get('socketio');
      if (io) {
        io.emit('fine_created', newFine);
      }

      return res.status(200).json({
        success: true,
        message: 'Violation approved and official fine generated.',
        data: { violation: vio, fine: newFine },
      });
    }

    const violation = await Violation.findById(req.params.id);
    if (!violation) {
      return res.status(404).json({ success: false, message: 'Violation not found' });
    }

    if (violation.reviewStatus === 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Violation is already approved and ticketed.' });
    }

    // Find configured fine rule
    let rule = null;
    if (fineRuleId) {
      rule = await FineRule.findById(fineRuleId);
    } else {
      rule = await FineRule.findOne({ violationType: violation.violationType, isActive: true });
    }

    if (!rule) {
      // Fallback rule if not seeded
      rule = await FineRule.findOne({ isActive: true }) || {
        _id: violation._id,
        baseFine: 1000,
        duePeriodDays: 15,
      };
    }

    const fineAmount = customFineAmount || rule.baseFine;
    const dueDate = getDueDate(dueDays || rule.duePeriodDays || 15);
    const fineId = generateId('DL');

    // Create Fine Ticket
    const fine = await Fine.create({
      fineId,
      violation: violation._id,
      user: violation.user,
      vehicle: violation.vehicle,
      vehicleNumber: violation.vehicleNumber,
      violationType: violation.violationType,
      fineRule: rule._id,
      fineAmount,
      dueDate,
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      issuedByOfficer: req.user._id,
      notificationLevel: 1,
    });

    // Update Violation
    violation.reviewStatus = 'APPROVED';
    violation.reviewedBy = req.user._id;
    violation.reviewedAt = new Date();
    violation.officerNotes = officerNotes || 'Violation validated by reviewing officer against photographic telemetry evidence.';
    violation.fine = fine._id;
    await violation.save();

    // Deduct Driver Safety Score for commuter
    if (violation.user) {
      await User.findByIdAndUpdate(violation.user, {
        $inc: { driverScore: -(rule.pointsDeduction || 3) },
      });
    }

    // Trigger Initial In-App & SMS Notification Escalation
    try {
      await notificationService.sendFineReminder(fine._id, 1);
    } catch (e) {
      console.warn('Initial reminder dispatch warning:', e.message);
    }

    // Audit approval action
    await recordAudit({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'VIOLATION_APPROVED',
      targetType: 'VIOLATION',
      targetId: violation.violationId,
      details: { fineId, fineAmount, officerNotes },
      req,
    });

    // Real-time broadcast
    const io = req.app.get('socketio');
    if (io) {
      io.emit('fine_created', {
        fineId: fine.fineId,
        vehicleNumber: fine.vehicleNumber,
        violationType: fine.violationType,
        fineAmount: fine.fineAmount,
        dueDate: fine.dueDate,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Violation approved by officer. Official legal fine generated successfully.',
      data: {
        violation,
        fine,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Officer Rejects Violation Candidate
 * @route   POST /api/violations/:id/reject
 */
const rejectViolation = async (req, res, next) => {
  try {
    const { officerNotes } = req.body;

    const violation = await Violation.findById(req.params.id);
    if (!violation) {
      return res.status(404).json({ success: false, message: 'Violation not found' });
    }

    violation.reviewStatus = 'REJECTED';
    violation.reviewedBy = req.user._id;
    violation.reviewedAt = new Date();
    violation.officerNotes = officerNotes || 'Rejected: Evidence insufficient or emergency vehicle priority justification.';
    await violation.save();

    await recordAudit({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'VIOLATION_REJECTED',
      targetType: 'VIOLATION',
      targetId: violation.violationId,
      details: { officerNotes },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Violation candidate rejected. No legal fine generated.',
      data: violation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Officer Marks Candidate as Needs Further Review
 * @route   POST /api/violations/:id/review
 */
const reviewViolation = async (req, res, next) => {
  try {
    const { officerNotes } = req.body;
    const violation = await Violation.findById(req.params.id);
    if (!violation) {
      return res.status(404).json({ success: false, message: 'Violation not found' });
    }

    violation.reviewStatus = 'NEEDS_REVIEW';
    violation.officerNotes = officerNotes || 'Flagged for secondary supervisor review.';
    await violation.save();

    res.status(200).json({
      success: true,
      message: 'Violation marked for additional secondary review',
      data: violation,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getViolations,
  createViolationCandidate,
  getViolationById,
  approveViolation,
  rejectViolation,
  reviewViolation,
};
