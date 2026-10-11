const mongoose = require('mongoose');

const nearMissSchema = new mongoose.Schema(
  {
    nearMissId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    vehicleNumber: {
      type: String,
      default: 'TN09AB1234',
    },
    eventType: {
      type: String,
      enum: [
        'Sudden Emergency Braking',
        'Near Collision (Frontal)',
        'Unsafe Blind Overtaking',
        'Pedestrian Jaywalking Risk',
        'Abrupt Lane Departure',
        'Wrong-Side Vehicle Avoidance',
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['MODERATE', 'HIGH', 'CRITICAL'],
      default: 'HIGH',
    },
    speedRecordedKmH: {
      type: Number,
      required: true,
    },
    decelerationGForce: {
      type: Number,
      default: 0.72,
    },
    distanceToObstacleMeters: {
      type: Number,
      default: 2.4,
    },
    locationName: {
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
    weather: {
      type: String,
      default: 'Clear',
    },
    roadCondition: {
      type: String,
      default: 'Normal Wet',
    },
    blackspotContributionScore: {
      type: Number,
      default: 15,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('NearMiss', nearMissSchema);
