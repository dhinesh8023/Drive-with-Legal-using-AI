const Payment = require("../models/Payment");
const Fine = require("../models/Fine");
const { success, error } = require("../utils/apiResponse");
const { initiatePayment, verifyPayment, isDemoMode } = require("../services/paymentProviderAdapter");
const { detectDuplicatePayments, detectRepeatedFailedPayments } = require("../services/anomalyDetectionService");
const { FINE_STATUS, PAYMENT_STATUS, AUDIT_ACTIONS } = require("../config/constants");

async function listPayments(req, res, next) {
  try {
    const filter = req.user.role === "USER" ? { user: req.user._id } : {};
    const payments = await Payment.find(filter).populate("fine").sort({ createdAt: -1 }).limit(200);
    return success(res, 200, "Payments fetched.", { payments, count: payments.length });
  } catch (err) {
    next(err);
  }
}

/** Step 1: create a payment attempt (INITIATED/PROCESSING). Never final on its own. */
async function createPayment(req, res, next) {
  try {
    const { fineId, method } = req.body;
    if (!fineId || !method) return error(res, 400, "fineId and method are required.");

    const fine = await Fine.findById(fineId);
    if (!fine) return error(res, 404, "Fine not found.");
    if (fine.status === FINE_STATUS.PAID) return error(res, 400, "This fine has already been paid.");
    if (fine.user.toString() !== req.user._id.toString()) return error(res, 403, "Forbidden.");

    const duplicateCheck = await detectDuplicatePayments({ fineId });

    const providerResult = await initiatePayment({ amount: fine.amount, method });

    const payment = await Payment.create({
      fine: fine._id,
      user: req.user._id,
      amount: fine.amount,
      method,
      transactionReference: providerResult.transactionReference,
      status: PAYMENT_STATUS.PROCESSING,
      isDemo: providerResult.isDemo,
    });

    fine.status = FINE_STATUS.UNDER_REVIEW;
    fine.payment = payment._id;
    await fine.save();

    return success(res, 201, "Payment initiated. Awaiting verification.", {
      payment,
      anomalyWarning: duplicateCheck.alert ? duplicateCheck : undefined,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Step 2: backend-side verification. The frontend's "success" message is
 * never trusted on its own — this endpoint is the source of truth for
 * whether a fine actually gets marked PAID.
 */
async function verifyPaymentController(req, res, next) {
  try {
    const { transactionReference } = req.body;
    const payment = await Payment.findOne({ transactionReference });
    if (!payment) return error(res, 404, "Payment not found.");

    const verification = await verifyPayment({ transactionReference });

    payment.status = verification.status === "SUCCESS" ? PAYMENT_STATUS.SUCCESS : PAYMENT_STATUS.FAILED;
    payment.verifiedAt = new Date();
    payment.verifiedBy = req.user ? req.user.role : "SYSTEM";
    await payment.save();

    const fine = await Fine.findById(payment.fine);
    if (fine) {
      fine.status = payment.status === PAYMENT_STATUS.SUCCESS ? FINE_STATUS.PAID : FINE_STATUS.PENDING;
      await fine.save();
    }

    if (payment.status === PAYMENT_STATUS.FAILED) {
      const repeatedFailures = await detectRepeatedFailedPayments({ userId: payment.user });
      if (repeatedFailures.alert) {
        console.warn("[ANOMALY]", repeatedFailures.message, "user:", payment.user.toString());
      }
    }

    if (req.logAudit) {
      await req.logAudit({
        action: AUDIT_ACTIONS.PAYMENT_VERIFIED,
        targetType: "Payment",
        targetId: payment._id,
        details: { status: payment.status },
      });
    }

    return success(res, 200, "Payment verification completed.", { payment, fine });
  } catch (err) {
    next(err);
  }
}

async function getPayment(req, res, next) {
  try {
    const payment = await Payment.findById(req.params.id).populate("fine");
    if (!payment) return error(res, 404, "Payment not found.");
    if (req.user.role === "USER" && payment.user.toString() !== req.user._id.toString()) {
      return error(res, 403, "Forbidden.");
    }
    return success(res, 200, "Payment fetched.", { payment });
  } catch (err) {
    next(err);
  }
}

module.exports = { listPayments, createPayment, verifyPaymentController, getPayment };
