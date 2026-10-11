const Hazard = require('../models/Hazard');
const { generateId } = require('../utils/helpers');

/**
 * @desc    Get all hazards
 * @route   GET /api/hazards
 */
const getHazards = async (req, res, next) => {
  try {
    const { status, hazardType, severity } = req.query;
    let query = {};
    if (status) query.status = status;
    if (hazardType) query.hazardType = hazardType;
    if (severity) query.severity = severity;

    const hazards = await Hazard.find(query).sort({ reportCount: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: hazards.length,
      data: hazards,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Report new hazard (Crowd-sourced or AI detected)
 * @route   POST /api/hazards
 */
const reportHazard = async (req, res, next) => {
  try {
    const {
      hazardType,
      description,
      latitude,
      longitude,
      locationName,
      severity,
      photoUrl,
    } = req.body;

    const lat = Number(latitude);
    const lon = Number(longitude);

    // AI Duplicate Check within ~200 meters (~0.002 deg)
    const existing = await Hazard.findOne({
      hazardType,
      latitude: { $gte: lat - 0.002, $lte: lat + 0.002 },
      longitude: { $gte: lon - 0.002, $lte: lon + 0.002 },
      status: { $ne: 'RESOLVED' },
    });

    if (existing) {
      existing.reportCount += 1;
      // Multiple reports boost AI confidence score up to 98%
      existing.aiConfidence = Math.min(98, existing.aiConfidence + 6);
      await existing.save();

      // Broadcast update
      const io = req.app.get('socketio');
      if (io) {
        io.emit('hazard_updated', {
          hazardId: existing.hazardId,
          reportCount: existing.reportCount,
          aiConfidence: existing.aiConfidence,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Hazard already registered in area. Confidence boosted via corroborating report.',
        data: existing,
      });
    }

    const hazardId = generateId('HAZ');
    const hazard = await Hazard.create({
      hazardId,
      reporter: req.user ? req.user._id : null,
      reporterName: req.user ? req.user.name : 'Verified Commuter',
      hazardType,
      description,
      latitude: lat,
      longitude: lon,
      locationName: locationName || 'Urban Roadway Corridor',
      severity: severity || 'MODERATE',
      photoUrl: photoUrl || '/assets/hazards/default_hazard.jpg',
      reportCount: 1,
      aiConfidence: 82,
      status: 'ACTIVE',
    });

    const io = req.app.get('socketio');
    if (io) {
      io.emit('new_hazard', hazard);
    }

    res.status(201).json({
      success: true,
      message: 'Road hazard submitted and mapped to predictive safety grid',
      data: hazard,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get nearby hazards for live navigation
 * @route   GET /api/hazards/nearby
 */
const getNearbyHazards = async (req, res, next) => {
  try {
    const { lat, lon, radiusKm = 10 } = req.query;
    const centerLat = Number(lat) || 12.9716;
    const centerLon = Number(lon) || 77.5946;

    // Approximate bounding box
    const delta = (radiusKm / 111.0);
    const hazards = await Hazard.find({
      latitude: { $gte: centerLat - delta, $lte: centerLat + delta },
      longitude: { $gte: centerLon - delta, $lte: centerLon + delta },
      status: { $ne: 'RESOLVED' },
    });

    res.status(200).json({
      success: true,
      count: hazards.length,
      data: hazards,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHazards,
  reportHazard,
  getNearbyHazards,
};
