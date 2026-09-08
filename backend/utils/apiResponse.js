/**
 * Ensures every API response follows the same shape across the platform:
 *   Success: { success: true, message, data }
 *   Error:   { success: false, message, errors }
 */

function success(res, statusCode, message, data = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function error(res, statusCode, message, errors = []) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

module.exports = { success, error };
