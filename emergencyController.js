const EmergencyEvent = require("../models/EmergencyEvent");
const { success, error } = require("../utils/apiResponse");
const { EMERGENCY_STATUS } = require("../config/constants");

/**
 * Prototype mode only: this NEVER contacts a real emergency service.
 * It creates an internal event and requires explicit manual confirmation
 * for any further action, as required by the project's safety rules.
 */
async function detectEmergency(req, res, next) {
  try {
    const { drivingSessionId, triggerReason, location } = req.body;

    const event = await EmergencyEvent.create({
      user: req.user._id,
      drivingSession: drivingSessionId,
      triggerReason: triggerReason || "MANUAL",
      location,
      status: EMERGENCY_STATUS.AWAITING_RESPONSE,
    });

    return success(res, 201, "Emergency event created (simulated). Awaiting user response.", { event });
  } catch (err) {
    next(err);
  }
}

async function respondToEmergency(req, res, next) {
  try {
    const { confirmed } = req.body; // true = "I'm okay" / false = "Need help"
    const event = await EmergencyEvent.findById(req.params.id);
    if (!event) return error(res, 404, "Emergency event not found.");
    if (event.user.toString() !== req.user._id.toString()) return error(res, 403, "Forbidden.");

    event.userRespondedAt = new Date();
    event.status = confirmed ? EMERGENCY_STATUS.CONFIRMED_FALSE_ALARM : EMERGENCY_STATUS.EMERGENCY_EVENT_CREATED;
    await event.save();

    return success(
      res,
      200,
      confirmed
        ? "Marked as false alarm."
        : "Emergency workflow simulated. In a real deployment, this would notify configured emergency contacts/services with explicit consent.",
      { event }
    );
  } catch (err) {
    next(err);
  }
}

async function listMyEmergencies(req, res, next) {
  try {
    const events = await EmergencyEvent.find({ user: req.user._id }).sort({ createdAt: -1 });
    return success(res, 200, "Emergency events fetched.", { events });
  } catch (err) {
    next(err);
  }
}

module.exports = { detectEmergency, respondToEmergency, listMyEmergencies };
