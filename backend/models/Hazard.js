const mongoose = require('mongoose');

const hazardSchema = new mongoose.Schema(
  {
    hazardId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    reporterName: {
      type: String,
      default: 'Verified Commuter',
    },
    hazardType: {
      type: String,
      enum: [
        'Pothole',
        'Accident',
        'Road Damage',
        'Flooding / Waterlogging',
        'Construction Zone',
        'Fallen Obstacle / Tree',
        'Dangerous Blind Curve',
        'Poor Visibility / Heavy Fog',
        'Faulty Traffic Light',
      ],
      required: true,
      index: true,
    },
    description: {
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
    locationName: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
      default: 'MODERATE',
    },
    photoUrl: {
      type: String,
      default: '/assets/hazards/default_hazard.jpg',
    },
    reportCount: {
      type: Number,
      default: 1,
    },
    aiConfidence: {
      type: Number,
      default: 82, // AI confidence score
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'VERIFIED_OFFICIAL', 'IN_REPAIR', 'RESOLVED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Hazard', hazardSchema);
