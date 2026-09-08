const Fine = require("../models/Fine");
const FineRule = require("../models/FineRule");
const Violation = require("../models/Violation");
const { success, error } = require("../utils/apiResponse");
const { sendReminder } = require("../services/notificationService");
const User = require("../models/User");
const {
  ROLES,
  FINE_STATUS,
  VIOLATION_REVIEW_STATUS,
  REMINDER_LEVELS,
  AUDIT_ACTIONS,
} = require("../config/constants");

async function listFines(req, res, next) {
  try {
    const { status } = req.query;
    const filter = {};
    if (req.user.role === ROLES.USER) filter.user = req.user._id;
    if (status) filter.status = status;

    const fines = await Fine.find(filter)
      .populate("violation")
      .populate("user", "name email phone")
      .populate("vehicle", "vehicleNumber")
      .sort({ createdAt: -1 })
      .limit(200);

    return success(res, 200, "Fines fetched.", { fines, count: fines.length });
  } catch (err) {
    next(err);
  }
}

/**
 * Generates a fine strictly from an APPROVED violation + a configured,
 * active FineRule. This is the only path that creates a Fine in the system.
 */
async function createFine(req, res, next) {
  try {
    const { violationId, fineRuleId, dueDateOverride } = req.body;

    const violation = await Violation.findById(violationId);
    if (!violation) return error(res, 404, "Violation not found.");
    if (violation.reviewStatus !== VIOLATION_REVIEW_STATUS.APPROVED) {
      return error(res, 400, "Only APPROVED violations can generate a fine.");
    }
    if (violation.fineGenerated) {
      return error(res, 409, "A fine has already been generated for this violation.");
    }

    const fineRule = await FineRule.findById(fineRuleId);
    if (!fineRule || !fineRule.isActive) {
      return error(res, 400, "Invalid or inactive fine rule.");
    }

    const dueDate = dueDateOverride
      ? new Date(dueDateOverride)
      : new Date(Date.now() + fineRule.duePeriodDays * 24 * 60 * 60 * 1000);

    const fineCode = `DL-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const fine = await Fine.create({
      fineCode,
      violation: violation._id,
      fineRule: fineRule._id,
      user: violation.user,
      vehicle: violation.vehicle,
      amount: fineRule.baseFineAmount,
      dueDate,
      status: FINE_STATUS.PENDING,
      generatedBy: req.user._id,
    });

    violation.fine = fine._id;
    violation.fineGenerated = true;
    await violation.save();

    // First reminder: in-app notification
    const user = await User.findById(violation.user);
    if (user) {
      await sendReminder({ fine, user, level: REMINDER_LEVELS.FIRST });
    }

    if (req.logAudit) {
      await req.logAudit({ action: AUDIT_ACTIONS.FINE_CREATED, targetType: "Fine", targetId: fine._id });
    }

    return success(res, 201, "Fine generated and user notified.", { fine });
  } catch (err) {
    next(err);
  }
}

async function getFine(req, res, next) {
  try {
    const fine = await Fine.findById(req.params.id)
      .populate("violation")
      .populate("user", "name email phone")
      .populate("vehicle", "vehicleNumber")
      .populate("fineRule");

    if (!fine) return error(res, 404, "Fine not found.");
    if (req.user.role === ROLES.USER && fine.user._id.toString() !== req.user._id.toString()) {
      return error(res, 403, "Forbidden.");
    }

    return success(res, 200, "Fine fetched.", { fine });
  } catch (err) {
    next(err);
  }
}

async function updateFine(req, res, next) {
  try {
    const fine = await Fine.findById(req.params.id);
    if (!fine) return error(res, 404, "Fine not found.");

    const editableFields = ["dueDate", "status"];
    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) fine[field] = req.body[field];
    });

    await fine.save();

    if (req.logAudit) {
      await req.logAudit({ action: AUDIT_ACTIONS.FINE_UPDATED, targetType: "Fine", targetId: fine._id });
    }

    return success(res, 200, "Fine updated.", { fine });
  } catch (err) {
    next(err);
  }
}

/** Manually escalate to the next reminder level (also run by a scheduled job in production). */
async function remindFine(req, res, next) {
  try {
    const fine = await Fine.findById(req.params.id);
    if (!fine) return error(res, 404, "Fine not found.");
    const user = await User.findById(fine.user);
    if (!user) return error(res, 404, "User not found.");

    const currentLevel = fine.notificationStatus?.lastReminderLevel;
    const order = [REMINDER_LEVELS.FIRST, REMINDER_LEVELS.SECOND, REMINDER_LEVELS.THIRD, REMINDER_LEVELS.FINAL];
    const nextLevel = order[order.indexOf(currentLevel) + 1] || order[0];

    const notifications = await sendReminder({ fine, user, level: nextLevel });

    if (req.logAudit) {
      await req.logAudit({
        action: AUDIT_ACTIONS.NOTIFICATION_SENT,
        targetType: "Fine",
        targetId: fine._id,
        details: { level: nextLevel },
      });
    }

    return success(res, 200, `Reminder (${nextLevel}) sent.`, { notifications });
  } catch (err) {
    next(err);
  }
}

async function cancelFine(req, res, next) {
  try {
    const fine = await Fine.findById(req.params.id);
    if (!fine) return error(res, 404, "Fine not found.");

    fine.status = FINE_STATUS.CANCELLED;
    await fine.save();

    if (req.logAudit) {
      await req.logAudit({ action: AUDIT_ACTIONS.FINE_UPDATED, targetType: "Fine", targetId: fine._id, details: { cancelled: true } });
    }

    return success(res, 200, "Fine cancelled.", { fine });
  } catch (err) {
    next(err);
  }
}

module.exports = { listFines, createFine, getFine, updateFine, remindFine, cancelFine };
