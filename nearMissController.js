const NearMiss = require("../models/NearMiss");
const { success, error } = require("../utils/apiResponse");

async function listNearMisses(req, res, next) {
  try {
    const filter = req.user.role === "USER" ? { user: req.user._id } : {};
    const nearMisses = await NearMiss.find(filter).sort({ occurredAt: -1 }).limit(200);
    return success(res, 200, "Near-miss events fetched.", { nearMisses, count: nearMisses.length });
  } catch (err) {
    next(err);
  }
}

async function createNearMiss(req, res, next) {
  try {
    const { eventType, location, context, drivingSession, vehicle } = req.body;
    if (!eventType) return error(res, 400, "eventType is required.");

    const nearMiss = await NearMiss.create({
      user: req.user._id,
      vehicle,
      drivingSession,
      eventType,
      location,
      context,
      occurredAt: new Date(),
    });

    return success(res, 201, "Near-miss event recorded.", { nearMiss });
  } catch (err) {
    next(err);
  }
}

module.exports = { listNearMisses, createNearMiss };
