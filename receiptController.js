const Fine = require("../models/Fine");
const Payment = require("../models/Payment");
const Violation = require("../models/Violation");
const { error } = require("../utils/apiResponse");
const { streamFineReceipt } = require("../services/receiptService");
const { ROLES, AUDIT_ACTIONS } = require("../config/constants");

async function downloadReceipt(req, res, next) {
  try {
    const fine = await Fine.findById(req.params.fineId).populate("user").populate("vehicle").populate("violation");
    if (!fine) return error(res, 404, "Fine not found.");

    const isOwner = fine.user._id.toString() === req.user._id.toString();
    const isStaff = [ROLES.POLICE, ROLES.GOVERNMENT_STAFF, ROLES.ADMIN].includes(req.user.role);
    if (!isOwner && !isStaff) {
      return error(res, 403, "Forbidden. You are not authorized to view this receipt.");
    }

    if (fine.status !== "PAID" || !fine.payment) {
      return error(res, 400, "This fine has not been paid yet. No receipt is available.");
    }

    const payment = await Payment.findById(fine.payment);
    if (!payment) return error(res, 404, "Payment record not found.");

    if (req.logAudit) {
      await req.logAudit({ action: AUDIT_ACTIONS.RECEIPT_ACCESSED, targetType: "Fine", targetId: fine._id });
    }

    streamFineReceipt(res, {
      fine,
      payment,
      user: fine.user,
      vehicleNumber: fine.vehicle ? fine.vehicle.vehicleNumber : fine.violation?.vehicleNumber,
      violationType: fine.violation?.violationType,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { downloadReceipt };
