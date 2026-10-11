const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema(
  {
    violationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: false,
      index: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    violationType: {
      type: String,
      required: true,
      index: true,
    },
    location: {
      type: String,
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    evidenceImage: {
      type: String,
      default: '/assets/evidence/default_violation.jpg',
    },
    evidenceVideoRef: {
      type: String,
      default: '',
    },
    aiConfidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    riskScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    detectionSource: {
      type: String,
      enum: ['AI Smart Camera', 'Highway Speed Sensor', 'Officer Patrol Drone', 'Smart Junction AI', 'In-Vehicle Live AI'],
      default: 'AI Smart Camera',
    },
    aiAnalysisDetails: {
      speedRecorded: Number,
      speedLimit: Number,
      distractionFactor: String,
      weatherCondition: String,
      reasons: [String],
    },
    reviewStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVIEW'],
      default: 'PENDING',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    officerNotes: {
      type: String,
      default: '',
    },
    fine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fine',
    },
    isAiAssisted: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Violation', violationSchema);
