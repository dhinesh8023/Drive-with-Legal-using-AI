const Hazard = require("../models/Hazard");
const { success, error } = require("../utils/apiResponse");

const NEARBY_RADIUS_DEGREES = 0.003; // ~300m approx, simple bounding box for demo purposes

async function listHazards(req, res, next) {
  try {
    const hazards = await Hazard.find({ isActive: true }).sort({ createdAt: -1 }).limit(300);
    return success(res, 200, "Hazards fetched.", { hazards, count: hazards.length });
  } catch (err) {
    next(err);
  }
}

/**
 * Reports a hazard and runs a lightweight AI duplicate-check: nearby
 * reports of the same type increase confidence rather than creating
 * redundant entries.
 */
async function createHazard(req, res, next) {
  try {
    const { hazardType, severity, description, photoUrl, location } = req.body;
    if (!hazardType || !location?.latitude || !location?.longitude) {
      return error(res, 400, "hazardType and location (latitude, longitude) are required.");
    }

    const nearbyDuplicate = await Hazard.findOne({
      hazardType,
      isActive: true,
      "location.latitude": { $gte: location.latitude - NEARBY_RADIUS_DEGREES, $lte: location.latitude + NEARBY_RADIUS_DEGREES },
      "location.longitude": { $gte: location.longitude - NEARBY_RADIUS_DEGREES, $lte: location.longitude + NEARBY_RADIUS_DEGREES },
    });

    if (nearbyDuplicate) {
      nearbyDuplicate.duplicateReportCount += 1;
      nearbyDuplicate.confidenceScore = Math.min(0.98, nearbyDuplicate.confidenceScore + 0.1);
      if (nearbyDuplicate.duplicateReportCount >= 3) nearbyDuplicate.isVerified = true;
      await nearbyDuplicate.save();

      return success(res, 200, "Matched an existing nearby hazard report. Confidence increased.", {
        hazard: nearbyDuplicate,
      });
    }

    const hazard = await Hazard.create({
      reportedBy: req.user._id,
      hazardType,
      severity,
      description,
      photoUrl,
      location,
      confidenceScore: 0.5,
    });

    return success(res, 201, "Hazard reported.", { hazard });
  } catch (err) {
    next(err);
  }
}

/** Simple bounding-box "nearby" query for the road-map page. */
async function nearbyHazards(req, res, next) {
  try {
    const { lat, lng, radius } = req.query;
    const r = parseFloat(radius) || 0.05;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return error(res, 400, "lat and lng query parameters are required.");
    }

    const hazards = await Hazard.find({
      isActive: true,
      "location.latitude": { $gte: latitude - r, $lte: latitude + r },
      "location.longitude": { $gte: longitude - r, $lte: longitude + r },
    });

    return success(res, 200, "Nearby hazards fetched.", { hazards, count: hazards.length });
  } catch (err) {
    next(err);
  }
}

module.exports = { listHazards, createHazard, nearbyHazards };
