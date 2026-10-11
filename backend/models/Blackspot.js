const mongoose = require('mongoose');

const blackspotSchema = new mongoose.Schema(
  {
    blackspotId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    roadName: {
      type: String,
      required: true,
      index: true,
    },
    district: {
      type: String,
      required: true,
      index: true,
    },
    state: {
      type: String,
      default: 'Tamil Nadu',
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
      default: 'HIGH',
    },
    historicalAccidentsCount: {
      type: Number,
      default: 0,
    },
    nearMissCount: {
      type: Number,
      default: 0,
    },
    hazardReportsCount: {
      type: Number,
      default: 0,
    },
    violationDensityScore: {
      type: Number,
      default: 0,
    },
    primaryRiskFactors: [
      {
        type: String,
      },
    ],
    recommendations: [
      {
        type: String,
      },
    ],
    aiConfidence: {
      type: Number,
      default: 88,
    },
    isAiAssisted: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE_WATCH', 'SAFETY_AUDIT_RECOMMENDED', 'CIVIC_INTERVENTION_PLANNED', 'MITIGATED'],
      default: 'ACTIVE_WATCH',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Blackspot', blackspotSchema);
