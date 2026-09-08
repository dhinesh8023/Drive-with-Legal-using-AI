const Blackspot = require("../models/Blackspot");
const NearMiss = require("../models/NearMiss");
const Hazard = require("../models/Hazard");
const Violation = require("../models/Violation");
const { success, error } = require("../utils/apiResponse");

async function listBlackspots(req, res, next) {
  try {
    const blackspots = await Blackspot.find({ isActive: true }).sort({ riskPercentage: -1 });
    return success(res, 200, "Blackspot predictions fetched.", { blackspots, count: blackspots.length });
  } catch (err) {
    next(err);
  }
}

const RADIUS = 0.01; // ~1km bounding box for demo clustering

/**
 * Recalculates (or creates) a blackspot risk estimate for a location,
 * based on nearby near-misses, hazard reports, and violation density.
 * ALWAYS labeled as an AI-assisted estimate, never a certified designation.
 */
async function recalculateBlackspot(req, res, next) {
  try {
    const { latitude, longitude, roadName, district, historicalAccidentCount } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return error(res, 400, "latitude and longitude are required.");
    }

    const box = (field) => ({
      [`${field}.latitude`]: { $gte: latitude - RADIUS, $lte: latitude + RADIUS },
      [`${field}.longitude`]: { $gte: longitude - RADIUS, $lte: longitude + RADIUS },
    });

    const nearMissCount = await NearMiss.countDocuments(box("location"));
    const hazardReportCount = await Hazard.countDocuments({ ...box("location"), isActive: true });
    const violationDensity = await Violation.countDocuments(box("location"));

    const accidents = historicalAccidentCount || 0;

    // Simple weighted, explainable formula (demo-grade, not a trained model).
    const rawScore =
      accidents * 12 + nearMissCount * 6 + hazardReportCount * 5 + violationDensity * 3;
    const riskPercentage = Math.min(99, Math.round(rawScore));

    let riskLevel = "LOW";
    if (riskPercentage >= 80) riskLevel = "CRITICAL";
    else if (riskPercentage >= 60) riskLevel = "HIGH";
    else if (riskPercentage >= 30) riskLevel = "MODERATE";

    const recommendations = [];
    if (riskLevel === "CRITICAL" || riskLevel === "HIGH") {
      recommendations.push("Install warning signs", "Increase monitoring", "Review speed limit");
    }
    if (hazardReportCount > 0) recommendations.push("Inspect road surface");
    if (nearMissCount > 0) recommendations.push("Improve lane markings", "Improve lighting");

    const blackspot = await Blackspot.findOneAndUpdate(
      {
        "location.latitude": { $gte: latitude - RADIUS, $lte: latitude + RADIUS },
        "location.longitude": { $gte: longitude - RADIUS, $lte: longitude + RADIUS },
      },
      {
        location: { latitude, longitude, roadName, district },
        riskPercentage,
        riskLevel,
        contributingFactors: {
          historicalAccidentCount: accidents,
          nearMissCount,
          hazardReportCount,
          violationDensity,
          trafficFactor: 0,
          weatherFactor: 0,
        },
        recommendations: [...new Set(recommendations)],
        lastCalculatedAt: new Date(),
        isActive: true,
      },
      { upsert: true, new: true }
    );

    return success(res, 200, "Blackspot risk estimate updated (AI-assisted).", { blackspot });
  } catch (err) {
    next(err);
  }
}

module.exports = { listBlackspots, recalculateBlackspot };
