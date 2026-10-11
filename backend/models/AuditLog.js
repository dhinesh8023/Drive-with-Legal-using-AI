const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    actorName: {
      type: String,
      default: 'System Agent',
    },
    actorRole: {
      type: String,
      enum: ['USER', 'POLICE', 'GOVERNMENT_STAFF', 'ADMIN', 'SYSTEM'],
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['USER', 'VIOLATION', 'FINE', 'PAYMENT', 'DISPUTE', 'HAZARD', 'FASTAG', 'SYSTEM', 'SEARCH'],
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
      default: 'Web Browser / SIH Client',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Read-only / append-friendly indexes
auditLogSchema.index({ timestamp: -1, action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
