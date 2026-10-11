const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Please provide vehicle registration number'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    vehicleType: {
      type: String,
      enum: ['Car', 'Two-Wheeler', 'SUV', 'Truck', 'Bus', 'Commercial', 'Electric Vehicle'],
      default: 'Car',
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      default: 2023,
    },
    color: {
      type: String,
      default: 'White',
    },
    fastagId: {
      type: String,
      trim: true,
      index: true,
    },
    insuranceNumber: {
      type: String,
      trim: true,
    },
    insuranceExpiry: {
      type: Date,
      default: () => new Date(+new Date() + 365 * 24 * 60 * 60 * 1000),
    },
    rcNumber: {
      type: String,
      trim: true,
    },
    fitnessExpiry: {
      type: Date,
    },
    pucExpiry: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Active', 'Impounded', 'Suspended', 'Unregistered'],
      default: 'Active',
    },
    currentRiskScore: {
      type: Number,
      default: 15,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
