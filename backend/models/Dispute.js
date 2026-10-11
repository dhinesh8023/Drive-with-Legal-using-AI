const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema(
  {
    disputeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    fine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fine',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: [
        'Incorrect Vehicle / Mismatched Plate',
        'Not Driving / Vehicle Sold or Stolen',
        'Medical or Life-Saving Emergency',
        'Traffic Police Manual Direction Override',
        'Camera Calibration / Glitch',
        'Other Justified Reason',
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    supportingEvidenceUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'REQUEST_MORE_INFO'],
      default: 'PENDING',
      index: true,
    },
    reviewedByOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    officerDecisionNotes: {
      type: String,
      default: '',
    },
    decisionHistory: [
      {
        action: { type: String, required: true },
        officerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Dispute', disputeSchema);
