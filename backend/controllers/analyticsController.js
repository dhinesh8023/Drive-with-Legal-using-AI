const Violation = require("../models/Violation");
const Fine = require("../models/Fine");
const Payment = require("../models/Payment");
const NearMiss = require("../models/NearMiss");
const Blackspot = require("../models/Blackspot");
const { success } = require("../utils/apiResponse");
const { FINE_STATUS, PAYMENT_STATUS } = require("../config/constants");

function dateRangeFilter(req) {
  const { from, to } = req.query;
  if (!from && !to) return {};
  const range = {};
  if (from) range.$gte = new Date(from);
  if (to) range.$lte = new Date(to);
  return range;
}

async function dashboardSummary(req, res, next) {
  try {
    const dateFilter = dateRangeFilter(req);
    const violationMatch = Object.keys(dateFilter).length ? { occurredAt: dateFilter } : {};

    const [totalViolations, pendingReview, totalFines, paidFines, pendingFines, overdueFines, totalPaidAmountAgg] =
      await Promise.all([
        Violation.countDocuments(violationMatch),
        Violation.countDocuments({ ...violationMatch, reviewStatus: "PENDING_REVIEW" }),
        Fine.countDocuments({}),
        Fine.countDocuments({ status: FINE_STATUS.PAID }),
        Fine.countDocuments({ status: FINE_STATUS.PENDING }),
        Fine.countDocuments({ status: FINE_STATUS.OVERDUE }),
        Payment.aggregate([
          { $match: { status: PAYMENT_STATUS.SUCCESS } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
      ]);

    const totalCollection = totalPaidAmountAgg[0]?.total || 0;

    const pendingCollectionAgg = await Fine.aggregate([
      { $match: { status: { $in: [FINE_STATUS.PENDING, FINE_STATUS.OVERDUE] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    return success(res, 200, "Dashboard summary fetched.", {
      totalViolations,
      pendingReview,
      totalFines,
      paidFines,
      pendingFines,
      overdueFines,
      totalCollection,
      pendingCollection: pendingCollectionAgg[0]?.total || 0,
    });
  } catch (err) {
    next(err);
  }
}

async function violationAnalytics(req, res, next) {
  try {
    const byType = await Violation.aggregate([{ $group: { _id: "$violationType", count: { $sum: 1 } } }]);
    const byDistrict = await Violation.aggregate([
      { $group: { _id: "$location.district", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return success(res, 200, "Violation analytics fetched.", { byType, byDistrict });
  } catch (err) {
    next(err);
  }
}

async function paymentAnalytics(req, res, next) {
  try {
    const byMethod = await Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.SUCCESS } },
      { $group: { _id: "$method", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);
    const trend = await Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.SUCCESS } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return success(res, 200, "Payment analytics fetched.", { byMethod, trend });
  } catch (err) {
    next(err);
  }
}

async function nearMissAnalytics(req, res, next) {
  try {
    const byType = await NearMiss.aggregate([{ $group: { _id: "$eventType", count: { $sum: 1 } } }]);
    const trend = await NearMiss.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$occurredAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return success(res, 200, "Near-miss analytics fetched.", { byType, trend });
  } catch (err) {
    next(err);
  }
}

async function blackspotAnalytics(req, res, next) {
  try {
    const blackspots = await Blackspot.find({ isActive: true }).sort({ riskPercentage: -1 }).limit(20);
    return success(res, 200, "Blackspot analytics fetched.", { blackspots });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  dashboardSummary,
  violationAnalytics,
  paymentAnalytics,
  nearMissAnalytics,
  blackspotAnalytics,
};
