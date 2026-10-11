const DrivingSession = require('../models/DrivingSession');
const NearMiss = require('../models/NearMiss');
const User = require('../models/User');
const riskEngine = require('../services/riskEngine');
const { generateId } = require('../utils/helpers');

/**
 * @desc    Start live driving session
 * @route   POST /api/driving/start
 */
const startSession = async (req, res, next) => {
  try {
    const { vehicleNumber } = req.body;
    const sessionId = generateId('TRIP');

    const session = await DrivingSession.create({
      sessionId,
      user: req.user._id,
      vehicleNumber: (vehicleNumber || 'TN09AB1234').toUpperCase().trim(),
      startTime: new Date(),
      status: 'ACTIVE',
      safetyScore: 95,
      currentRiskScore: 10,
      currentRiskLevel: 'SAFE',
    });

    res.status(201).json({
      success: true,
      message: 'Live AI Driving Session initialized',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update live telemetry & evaluate scenario risk
 * @route   POST /api/driving/update
 */
const updateSession = async (req, res, next) => {
  try {
    const { sessionId, scenario, telemetry, latitude, longitude, roadName } = req.body;

    let session = await DrivingSession.findOne({ sessionId, user: req.user._id });
    if (!session) {
      // Auto-fallback session if not found
      session = await DrivingSession.create({
        sessionId: sessionId || generateId('TRIP'),
        user: req.user._id,
        vehicleNumber: 'TN09AB1234',
        status: 'ACTIVE',
      });
    }

    // Evaluate risk with explainable AI engine
    const evaluation = await riskEngine.evaluateRisk({
      scenario: scenario || 'NORMAL DRIVING',
      ...telemetry,
    });

    // Update session state
    session.currentRiskScore = evaluation.riskScore;
    session.currentRiskLevel = evaluation.riskLevel;
    if (telemetry?.speed) {
      session.telemetry.speed = telemetry.speed;
      session.topSpeed = Math.max(session.topSpeed, telemetry.speed);
    }
    if (telemetry?.driverAttention !== undefined) session.telemetry.driverAttention = telemetry.driverAttention;
    if (telemetry?.drowsinessIndex !== undefined) session.telemetry.drowsinessIndex = telemetry.drowsinessIndex;

    // Log significant risk event
    if (evaluation.riskScore > 30 || scenario !== 'NORMAL DRIVING') {
      session.events.push({
        scenario: scenario || 'Risk Factor Spike',
        riskScore: evaluation.riskScore,
        riskLevel: evaluation.riskLevel,
        reasons: evaluation.reasons,
        recommendation: evaluation.recommendations[0] || 'Maintain caution',
      });
    }

    // If Near Miss scenario, store to NearMiss collection for Blackspot prediction intelligence
    const nearMissScenarios = [
      'SUDDEN BRAKING',
      'COLLISION RISK',
      'UNSAFE OVERTAKING',
      'LANE DEPARTURE',
      'WRONG SIDE DRIVING',
    ];

    if (nearMissScenarios.includes(scenario)) {
      await NearMiss.create({
        nearMissId: generateId('NM'),
        user: req.user._id,
        vehicleNumber: session.vehicleNumber,
        eventType:
          scenario === 'SUDDEN BRAKING'
            ? 'Sudden Emergency Braking'
            : scenario === 'COLLISION RISK'
            ? 'Near Collision (Frontal)'
            : scenario === 'UNSAFE OVERTAKING'
            ? 'Unsafe Blind Overtaking'
            : scenario === 'LANE DEPARTURE'
            ? 'Abrupt Lane Departure'
            : 'Wrong-Side Vehicle Avoidance',
        severity: evaluation.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        speedRecordedKmH: telemetry?.speed || 68,
        locationName: roadName || 'Outer Ring Road Expressway',
        latitude: latitude || 12.9279,
        longitude: longitude || 77.6271,
        weather: telemetry?.weather || 'Clear',
      });
    }

    await session.save();

    // Broadcast to connected frontend via Socket.IO
    const io = req.app.get('socketio');
    if (io) {
      io.emit('risk_updated', {
        userId: req.user._id,
        sessionId: session.sessionId,
        riskScore: evaluation.riskScore,
        riskLevel: evaluation.riskLevel,
        scenario,
        evaluation,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        session,
        evaluation,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    End driving session & compute final safety score
 * @route   POST /api/driving/end
 */
const endSession = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const session = await DrivingSession.findOne({ sessionId, user: req.user._id });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Driving session not found' });
    }

    session.status = 'COMPLETED';
    session.endTime = new Date();

    // Calculate trip score based on events penalty
    let penalty = 0;
    session.events.forEach((ev) => {
      if (ev.riskLevel === 'CRITICAL') penalty += 8;
      else if (ev.riskLevel === 'HIGH') penalty += 4;
      else if (ev.riskLevel === 'MODERATE') penalty += 2;
    });

    session.safetyScore = Math.max(45, 100 - penalty);
    await session.save();

    // Update user profile driverScore as moving average
    const user = await User.findById(req.user._id);
    if (user) {
      user.driverScore = Math.round(user.driverScore * 0.7 + session.safetyScore * 0.3);
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Driving session successfully archived',
      data: {
        session,
        updatedUserScore: user ? user.driverScore : session.safetyScore,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get trip history
 * @route   GET /api/driving/history
 */
const getSessionHistory = async (req, res, next) => {
  try {
    const sessions = await DrivingSession.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Trigger simulated emergency SOS workflow
 * @route   POST /api/driving/emergency
 */
const triggerEmergency = async (req, res, next) => {
  try {
    const { latitude, longitude, locationName, crashGForce = 4.2 } = req.body;

    const event = {
      eventId: generateId('SOS'),
      user: req.user._id,
      userName: req.user.name,
      userPhone: req.user.phone,
      emergencyContacts: req.user.emergencyContacts,
      location: {
        latitude: latitude || 12.9716,
        longitude: longitude || 77.5946,
        locationName: locationName || 'Anna Salai Corridor, Segment 3',
      },
      crashGForce,
      status: 'SIMULATED_DISPATCHED',
      simulatedDispatchUnits: ['Ambulance 108 Dispatch', 'Highway Patrol QRT 04'],
      timestamp: new Date().toISOString(),
    };

    const io = req.app.get('socketio');
    if (io) {
      io.emit('emergency_alert', event);
    }

    res.status(200).json({
      success: true,
      message: 'Emergency event recorded. Automated prototype SOS dispatched to emergency network.',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startSession,
  updateSession,
  endSession,
  getSessionHistory,
  triggerEmergency,
};
