const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

/**
 * Record an immutable audit log entry
 */
const recordAudit = async ({
  actorId = null,
  actorName = 'System',
  actorRole = 'SYSTEM',
  action,
  targetType,
  targetId = '',
  details = {},
  req = null,
}) => {
  try {
    const ipAddress = req
      ? req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1'
      : '127.0.0.1';
    const userAgent = req ? req.headers['user-agent'] || 'API Client' : 'Internal Service';

    const log = await AuditLog.create({
      actorId,
      actorName,
      actorRole,
      action,
      targetType,
      targetId,
      details,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });

    logger.audit(actorName, `${action} [${targetType}:${targetId}]`, details);
    return log;
  } catch (err) {
    console.error('[Audit Service Error] Failed to write audit log:', err.message);
    return null;
  }
};

module.exports = { recordAudit };
