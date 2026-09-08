const Payment = require("../models/Payment");

/**
 * Basic rule-based anomaly detection for the prototype.
 * IMPORTANT: this never auto-labels a user as fraudulent. All output is
 * phrased as "potential anomaly, requires review" per project policy.
 */

async function detectDuplicatePayments({ fineId, windowMinutes = 30 }) {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);
  const recentPayments = await Payment.find({ fine: fineId, createdAt: { $gte: since } }).sort({ createdAt: 1 });

  if (recentPayments.length > 1) {
    return {
      alert: true,
      type: "POTENTIAL_DUPLICATE_PAYMENT",
      confidence: 0.88,
      message: "Potential Anomaly: multiple payment attempts detected for the same fine in a short window.",
      recommendedAction: "Manual verification required.",
      count: recentPayments.length,
    };
  }

  return { alert: false };
}

async function detectRepeatedFailedPayments({ userId, windowMinutes = 60, threshold = 3 }) {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);
  const failedCount = await Payment.countDocuments({
    user: userId,
    status: "FAILED",
    createdAt: { $gte: since },
  });

  if (failedCount >= threshold) {
    return {
      alert: true,
      type: "REPEATED_FAILED_PAYMENTS",
      confidence: 0.75,
      message: "Potential Anomaly: repeated failed payment attempts detected.",
      recommendedAction: "Manual verification required.",
      count: failedCount,
    };
  }

  return { alert: false };
}

module.exports = { detectDuplicatePayments, detectRepeatedFailedPayments };
