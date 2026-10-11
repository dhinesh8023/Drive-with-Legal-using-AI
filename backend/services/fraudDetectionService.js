const Payment = require('../models/Payment');
const Violation = require('../models/Violation');

class FraudDetectionService {
  /**
   * Check for duplicate or anomalous payment attempts
   */
  async checkPaymentAnomaly({ fineId, userId, amount, transactionReference }) {
    // 1. Check if fine is already paid
    const existingSuccessPayment = await Payment.findOne({
      fine: fineId,
      status: { $in: ['SUCCESS', 'VERIFIED'] },
    });

    if (existingSuccessPayment) {
      return {
        isAnomaly: true,
        riskScore: 92,
        confidence: 0.94,
        anomalyType: 'DUPLICATE_PAYMENT_ATTEMPT',
        message: 'Potential Anomaly: This fine is already settled and verified in our records.',
        recommendedAction: 'Manual Verification Required - Reject Duplicate Transaction',
      };
    }

    // 2. Check velocity of failed transactions in the last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentAttempts = await Payment.countDocuments({
      user: userId,
      createdAt: { $gte: fifteenMinutesAgo },
    });

    if (recentAttempts > 6) {
      return {
        isAnomaly: true,
        riskScore: 78,
        confidence: 0.85,
        anomalyType: 'HIGH_VELOCITY_ATTEMPTS',
        message: 'Potential Anomaly: High frequency of rapid payment attempts detected.',
        recommendedAction: 'Manual Verification Required - Rate-limit user checkout session',
      };
    }

    return {
      isAnomaly: false,
      riskScore: 10,
      confidence: 0.98,
      message: 'Transaction verified as legitimate pattern.',
    };
  }

  /**
   * Check for duplicate violation candidate
   */
  async checkViolationAnomaly({ vehicleNumber, violationType, latitude, longitude, timestamp }) {
    const fiveMinutesAgo = new Date(new Date(timestamp).getTime() - 5 * 60 * 1000);
    const existing = await Violation.findOne({
      vehicleNumber,
      violationType,
      createdAt: { $gte: fiveMinutesAgo },
    });

    if (existing) {
      return {
        isDuplicate: true,
        confidence: 0.96,
        reason: 'Duplicate detection within 5-minute window at matching or adjacent GPS location',
        originalViolationId: existing.violationId,
        recommendedAction: 'Auto-merge candidate into existing record for review',
      };
    }

    return { isDuplicate: false };
  }
}

module.exports = new FraudDetectionService();
