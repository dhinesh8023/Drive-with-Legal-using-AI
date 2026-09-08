const { v4: uuidv4 } = require("uuid");
const AuditLog = require("../models/AuditLog");

/**
 * Attaches a per-request ID (useful for correlating audit entries with logs)
 * and exposes req.logAudit(...) so controllers can record sensitive actions
 * (searches, approvals, payments, disputes) without re-deriving actor info.
 */
function attachAuditContext(req, res, next) {
  req.requestId = uuidv4();

  req.logAudit = async ({ action, targetType, targetId, details, resultCount }) => {
    try {
      if (!req.user) return; // only authenticated actions are audited
      await AuditLog.create({
        actorId: req.user._id,
        actorRole: req.user.role,
        action,
        targetType,
        targetId,
        details,
        resultCount,
        requestId: req.requestId,
        ipAddress: req.ip,
      });
    } catch (err) {
      // Audit logging must never crash the primary request.
      console.error("[AUDIT] Failed to write audit log:", err.message);
    }
  };

  next();
}

module.exports = { attachAuditContext };
