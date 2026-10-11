const Violation = require('../models/Violation');
const Fine = require('../models/Fine');
const Payment = require('../models/Payment');
const Hazard = require('../models/Hazard');
const NearMiss = require('../models/NearMiss');
const Blackspot = require('../models/Blackspot');
const User = require('../models/User');

/**
 * @desc    Comprehensive Government & Police Command Analytics
 * @route   GET /api/analytics/dashboard
 */
const getDashboardAnalytics = async (req, res, next) => {
  try {
    // 1. Violations metrics
    const totalViolations = await Violation.countDocuments();
    const pendingReview = await Violation.countDocuments({ reviewStatus: 'PENDING' });
    const approvedViolations = await Violation.countDocuments({ reviewStatus: 'APPROVED' });
    const rejectedViolations = await Violation.countDocuments({ reviewStatus: 'REJECTED' });

    // 2. Fine financials
    const totalFinesCount = await Fine.countDocuments();
    const paidFines = await Fine.find({ status: 'PAID' });
    const pendingFines = await Fine.find({ status: 'PENDING' });
    const overdueFines = await Fine.find({ status: 'OVERDUE' });

    const totalCollectionAmount = paidFines.reduce((acc, f) => acc + (f.fineAmount || 0), 0);
    const pendingCollectionAmount = pendingFines.reduce((acc, f) => acc + (f.fineAmount || 0), 0);
    const overdueCollectionAmount = overdueFines.reduce((acc, f) => acc + (f.fineAmount || 0), 0);

    // 3. Hazard & Blackspot counts
    const activeHazardsCount = await Hazard.countDocuments({ status: { $ne: 'RESOLVED' } });
    const blackspotsCount = await Blackspot.countDocuments();
    const nearMissesCount = await NearMiss.countDocuments();

    // 4. Violation breakdown by type
    const violationTypeStats = await Violation.aggregate([
      { $group: { _id: '$violationType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    // 5. Payment method breakdown
    const paymentMethodStats = await Payment.aggregate([
      { $match: { status: 'SUCCESS' } },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
    ]);

    // 6. District violation distribution (Mock aggregation / actual)
    const districtStats = [
      { district: 'Chennai Central', count: Math.round(totalViolations * 0.32) || 14 },
      { district: 'Bengaluru South', count: Math.round(totalViolations * 0.28) || 12 },
      { district: 'Coimbatore Urban', count: Math.round(totalViolations * 0.18) || 8 },
      { district: 'Madurai Ring Road', count: Math.round(totalViolations * 0.14) || 6 },
      { district: 'Salem Expressway', count: Math.round(totalViolations * 0.08) || 4 },
    ];

    res.status(200).json({
      success: true,
      data: {
        violations: {
          total: totalViolations,
          pendingReview,
          approved: approvedViolations,
          rejected: rejectedViolations,
          byType: violationTypeStats,
        },
        finances: {
          totalFinesCount,
          totalCollected: totalCollectionAmount,
          pendingCollection: pendingCollectionAmount,
          overdueCollection: overdueCollectionAmount,
          paymentMethods: paymentMethodStats,
        },
        roadSafety: {
          activeHazards: activeHazardsCount,
          highRiskBlackspots: blackspotsCount,
          recordedNearMisses: nearMissesCount,
          districts: districtStats,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Blackspots Analytics & AI Recommendations
 * @route   GET /api/analytics/blackspots
 */
const getBlackspotsAnalytics = async (req, res, next) => {
  try {
    const blackspots = await Blackspot.find().sort({ riskScore: -1 });

    res.status(200).json({
      success: true,
      count: blackspots.length,
      data: blackspots,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Near Miss Telemetry Intelligence
 * @route   GET /api/analytics/near-misses
 */
const getNearMissesAnalytics = async (req, res, next) => {
  try {
    const nearMisses = await NearMiss.find().sort({ createdAt: -1 }).limit(100);

    // Event type distribution
    const eventBreakdown = await NearMiss.aggregate([
      { $group: { _id: '$eventType', count: { $sum: 1 }, avgGForce: { $avg: '$decelerationGForce' } } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      count: nearMisses.length,
      data: {
        recentEvents: nearMisses,
        breakdown: eventBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Repeat Offender Analytics
 * @route   GET /api/analytics/repeat-offenders
 */
const getRepeatOffenders = async (req, res, next) => {
  try {
    // Group violations by vehicleNumber
    const repeaters = await Violation.aggregate([
      { $match: { reviewStatus: 'APPROVED' } },
      {
        $group: {
          _id: '$vehicleNumber',
          violationCount: { $sum: 1 },
          types: { $addToSet: '$violationType' },
          lastIncident: { $max: '$createdAt' },
          avgRiskScore: { $avg: '$riskScore' },
        },
      },
      { $match: { violationCount: { $gte: 2 } } },
      { $sort: { violationCount: -1 } },
      { $limit: 20 },
    ]);

    res.status(200).json({
      success: true,
      count: repeaters.length,
      data: repeaters,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardAnalytics,
  getBlackspotsAnalytics,
  getNearMissesAnalytics,
  getRepeatOffenders,
};
