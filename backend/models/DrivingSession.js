const mongoose = require('mongoose');

const drivingSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
      uppercase: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'EMERGENCY_INTERRUPTED'],
      default: 'ACTIVE',
      index: true,
    },
    averageSpeed: {
      type: Number,
      default: 45,
    },
    topSpeed: {
      type: Number,
      default: 65,
    },
    distanceKm: {
      type: Number,
      default: 0,
    },
    safetyScore: {
      type: Number,
      default: 92,
      min: 0,
      max: 100,
    },
    currentRiskScore: {
      type: Number,
      default: 15,
      min: 0,
      max: 100,
    },
    currentRiskLevel: {
      type: String,
      enum: ['SAFE', 'MODERATE', 'HIGH', 'CRITICAL'],
      default: 'SAFE',
    },
    telemetry: {
      speed: { type: Number, default: 45 },
      recommendedSpeed: { type: Number, default: 60 },
      driverAttention: { type: Number, default: 94 }, // %
      drowsinessIndex: { type: Number, default: 5 }, // %
      distractionIndex: { type: Number, default: 8 }, // %
      weatherCondition: { type: String, default: 'Clear Day' },
      roadCondition: { type: String, default: 'Smooth Asphalt' },
      trafficDensity: { type: String, default: 'Moderate' },
      followingDistanceMeters: { type: Number, default: 28 },
    },
    events: [
      {
        timestamp: { type: Date, default: Date.now },
        scenario: { type: String, required: true },
        riskScore: { type: Number, required: true },
        riskLevel: { type: String, required: true },
        reasons: [String],
        recommendation: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DrivingSession', drivingSessionSchema);
