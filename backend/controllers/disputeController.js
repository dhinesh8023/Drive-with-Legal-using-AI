const Dispute = require('../models/Dispute');
const Fine = require('../models/Fine');
const { generateId } = require('../utils/helpers');
const { recordAudit } = require('../services/auditService');

/**
 * @desc    Get disputes (User gets their own, Police/Admin gets all)
 * @route   GET /api/disputes
 */
const getDisputes = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'USER') {
      query.user = req.user._id;
    }

    const disputes = await Dispute.find(query)
      .populate('fine')
      .populate('user', 'name email phone')
      .populate('reviewedByOfficer', 'name officerId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: disputes.length,
      data: disputes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit a fine dispute
 * @route   POST /api/disputes
 */
const createDispute = async (req, res, next) => {
  try {
    const { fineId, reason, description, supportingEvidenceUrl } = req.body;

    const fine = await Fine.findById(fineId);
    if (!fine) {
      return res.status(404).json({ success: false, message: 'Fine record not found' });
    }

    if (fine.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Settled fines cannot be disputed online. Please contact the district tribunal.',
      });
    }

    const existingDispute = await Dispute.findOne({ fine: fine._id, status: 'PENDING' });
    if (existingDispute) {
      return res.status(400).json({
        success: false,
        message: 'A dispute is already under review for this fine ticket.',
      });
    }

    const disputeId = generateId('DSP');
    const dispute = await Dispute.create({
      disputeId,
      fine: fine._id,
      user: req.user._id,
      reason,
      description,
      supportingEvidenceUrl: supportingEvidenceUrl || '',
      status: 'PENDING',
      decisionHistory: [
        {
          action: 'DISPUTE_SUBMITTED',
          timestamp: new Date(),
          note: description,
        },
      ],
    });

    fine.status = 'DISPUTED';
    fine.disputeReason = reason;
    await fine.save();

    await recordAudit({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'DISPUTE_SUBMITTED',
      targetType: 'DISPUTE',
      targetId: disputeId,
      details: { fineId: fine.fineId, reason },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Dispute submitted successfully. Fine is on judicial hold pending officer review.',
      data: dispute,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Officer reviews dispute (Accept / Reject / Request Info)
 * @route   POST /api/disputes/:id/review
 */
const reviewDispute = async (req, res, next) => {
  try {
    const { decision, notes } = req.body; // 'ACCEPTED', 'REJECTED', 'REQUEST_MORE_INFO'

    const dispute = await Dispute.findById(req.params.id).populate('fine');
    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute record not found' });
    }

    dispute.status = decision;
    dispute.reviewedByOfficer = req.user._id;
    dispute.reviewedAt = new Date();
    dispute.officerDecisionNotes = notes || '';

    dispute.decisionHistory.push({
      action: `DECISION_${decision}`,
      officerId: req.user._id,
      timestamp: new Date(),
      note: notes || '',
    });

    await dispute.save();

    // Update associated fine ticket
    const fine = await Fine.findById(dispute.fine._id);
    if (decision === 'ACCEPTED') {
      fine.status = 'CANCELLED';
    } else if (decision === 'REJECTED') {
      fine.status = 'PENDING';
    } else if (decision === 'REQUEST_MORE_INFO') {
      fine.status = 'UNDER_REVIEW';
    }
    await fine.save();

    await recordAudit({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: `DISPUTE_REVIEW_${decision}`,
      targetType: 'DISPUTE',
      targetId: dispute.disputeId,
      details: { decision, notes, fineId: fine.fineId },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Dispute review finalized with decision: ${decision}`,
      data: dispute,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDisputes,
  createDispute,
  reviewDispute,
};
