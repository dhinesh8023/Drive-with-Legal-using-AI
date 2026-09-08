const mongoose = require("mongoose");
const { AUDIT_ACTIONS, ROLES } = require("../config/constants");

/**
 * Audit logs are append-only from the application's perspective:
 * no route or controller in this project ever updates or deletes
 * an AuditLog document. (True immutability would additionally
 * require DB-level permissions/WORM storage in production.)
 */
const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actorRole: { type: String, enum: Object.values(ROLES), required: true },

    action: { type: String, enum: Object.values(AUDIT_ACTIONS), required: true, index: true },

    targetType: { type: String }, // e.g. "Violation", "Fine", "User"
    targetId: { type: mongoose.Schema.Types.ObjectId },

    details: { type: mongoose.Schema.Types.Mixed },
    resultCount: { type: Number },

    requestId: { type: String },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
