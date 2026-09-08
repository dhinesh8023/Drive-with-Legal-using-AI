const Violation = require("../models/Violation");
const Vehicle = require("../models/Vehicle");
const { success, error } = require("../utils/apiResponse");
const { ROLES, VIOLATION_REVIEW_STATUS, AUDIT_ACTIONS } = require("../config/constants");

async function listViolations(req, res, next) {
  try {
    const { status, violationType, district, from, to } = req.query;
    const filter = {};

    if (req.user.role === ROLES.USER) filter.user = req.user._id;
    if (status) filter.reviewStatus = status;
    if (violationType) filter.violationType = violationType;
    if (district) filter["location.district"] = district;
    if (from || to) {
      filter.occurredAt = {};
      if (from) filter.occurredAt.$gte = new Date(from);
      if (to) filter.occurredAt.$lte = new Date(to);
    }

    const violations = await Violation.find(filter)
      .populate("user", "name email phone")
      .populate("vehicle", "vehicleNumber vehicleType")
      .sort({ occurredAt: -1 })
      .limit(200);

    return success(res, 200, "Violations fetched.", { violations, count: violations.length });
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a violation CANDIDATE. This never finalizes a fine — it only
 * records what the AI (or a manual report) flagged, awaiting officer review.
 */
async function createViolation(req, res, next) {
  try {
    const {
      vehicleNumber,
      violationType,
      location,
      occurredAt,
      evidence,
      aiConfidence,
      riskScoreAtDetection,
      detectionSource,
    } = req.body;

    if (!violationType || !vehicleNumber) {
      return error(res, 400, "violationType and vehicleNumber are required.");
    }

    const vehicle = await Vehicle.findOne({ vehicleNumber: vehicleNumber.toUpperCase() });

    const violation = await Violation.create({
      user: vehicle ? vehicle.owner : undefined,
      vehicle: vehicle ? vehicle._id : undefined,
      vehicleNumber: vehicleNumber.toUpperCase(),
      violationType,
      location,
      occurredAt: occurredAt || new Date(),
      evidence,
      aiConfidence,
      riskScoreAtDetection,
      detectionSource,
      reviewStatus: VIOLATION_REVIEW_STATUS.PENDING_REVIEW,
    });

    return success(res, 201, "Violation candidate recorded. Pending officer review.", { violation });
  } catch (err) {
    next(err);
  }
}

async function getViolation(req, res, next) {
  try {
    const violation = await Violation.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("vehicle", "vehicleNumber vehicleType")
      .populate("reviewedBy", "name officerId");

    if (!violation) return error(res, 404, "Violation not found.");

    if (req.user.role === ROLES.USER && (!violation.user || violation.user._id.toString() !== req.user._id.toString())) {
      return error(res, 403, "Forbidden.");
    }

    if (req.logAudit) {
      await req.logAudit({ action: AUDIT_ACTIONS.VIOLATION_VIEWED, targetType: "Violation", targetId: violation._id });
    }

    return success(res, 200, "Violation fetched.", { violation });
  } catch (err) {
    next(err);
  }
}

/** Officer review action: APPROVE | REJECT | MORE_REVIEW_REQUIRED */
async function reviewViolation(req, res, next) {
  try {
    const { decision, notes } = req.body; // decision: APPROVED | REJECTED | MORE_REVIEW_REQUIRED
    const violation = await Violation.findById(req.params.id);
    if (!violation) return error(res, 404, "Violation not found.");

    if (!Object.values(VIOLATION_REVIEW_STATUS).includes(decision)) {
      return error(res, 400, "Invalid decision value.");
    }

    violation.reviewStatus = decision;
    violation.reviewedBy = req.user._id;
    violation.reviewedAt = new Date();
    violation.officerNotes = notes;
    await violation.save();

    if (req.logAudit) {
      const action =
        decision === VIOLATION_REVIEW_STATUS.APPROVED
          ? AUDIT_ACTIONS.VIOLATION_APPROVED
          : AUDIT_ACTIONS.VIOLATION_REJECTED;
      await req.logAudit({ action, targetType: "Violation", targetId: violation._id, details: { notes } });
    }

    return success(res, 200, `Violation marked as ${decision}.`, { violation });
  } catch (err) {
    next(err);
  }
}

module.exports = { listViolations, createViolation, getViolation, reviewViolation };
