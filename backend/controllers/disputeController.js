const Dispute = require("../models/Dispute");
const Fine = require("../models/Fine");
const { success, error } = require("../utils/apiResponse");
const { FINE_STATUS, DISPUTE_STATUS, AUDIT_ACTIONS, ROLES } = require("../config/constants");

async function listDisputes(req, res, next) {
  try {
    const filter = req.user.role === ROLES.USER ? { user: req.user._id } : {};
    const disputes = await Dispute.find(filter)
      .populate("fine")
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    return success(res, 200, "Disputes fetched.", { disputes, count: disputes.length });
  } catch (err) {
    next(err);
  }
}

async function createDispute(req, res, next) {
  try {
    const { fineId, reason, description, supportingEvidenceUrl } = req.body;
    if (!fineId || !reason) return error(res, 400, "fineId and reason are required.");

    const fine = await Fine.findById(fineId);
    if (!fine) return error(res, 404, "Fine not found.");
    if (fine.user.toString() !== req.user._id.toString()) return error(res, 403, "Forbidden.");

    const dispute = await Dispute.create({
      fine: fine._id,
      user: req.user._id,
      reason,
      description,
      supportingEvidenceUrl,
      status: DISPUTE_STATUS.RECEIVED,
      decisionHistory: [{ action: "SUBMITTED", by: req.user._id, note: reason }],
    });

    fine.status = FINE_STATUS.DISPUTED;
    fine.dispute = dispute._id;
    await fine.save();

    return success(res, 201, "Dispute submitted.", { dispute });
  } catch (err) {
    next(err);
  }
}

/** Officer/admin decision: ACCEPTED | REJECTED | MORE_INFO_REQUESTED */
async function reviewDispute(req, res, next) {
  try {
    const { decision, note } = req.body;
    if (!Object.values(DISPUTE_STATUS).includes(decision)) {
      return error(res, 400, "Invalid decision value.");
    }

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return error(res, 404, "Dispute not found.");

    dispute.status = decision;
    dispute.reviewedBy = req.user._id;
    dispute.decisionHistory.push({ action: decision, by: req.user._id, note });
    await dispute.save();

    const fine = await Fine.findById(dispute.fine);
    if (fine) {
      if (decision === DISPUTE_STATUS.ACCEPTED) {
        fine.status = FINE_STATUS.CANCELLED;
      } else if (decision === DISPUTE_STATUS.REJECTED) {
        fine.status = FINE_STATUS.PENDING;
      }
      await fine.save();
    }

    if (req.logAudit) {
      await req.logAudit({ action: AUDIT_ACTIONS.DISPUTE_DECISION, targetType: "Dispute", targetId: dispute._id, details: { decision, note } });
    }

    return success(res, 200, `Dispute marked as ${decision}.`, { dispute, fine });
  } catch (err) {
    next(err);
  }
}

module.exports = { listDisputes, createDispute, reviewDispute };
