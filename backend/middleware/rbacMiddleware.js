const { error } = require("../utils/apiResponse");

/**
 * Restricts a route to one or more roles.
 * Usage: router.get('/x', protect, allowRoles('ADMIN', 'POLICE'), handler)
 */
function allowRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 401, "Unauthorized.");
    }
    if (!allowedRoles.includes(req.user.role)) {
      return error(
        res,
        403,
        `Forbidden. This action requires one of the following roles: ${allowedRoles.join(", ")}.`
      );
    }
    next();
  };
}

/**
 * For POLICE / GOVERNMENT_STAFF accounts, also require admin approval
 * to have been granted (see User.isStaffApproved), on top of role match.
 */
function requireStaffApproval(req, res, next) {
  const staffRoles = ["POLICE", "GOVERNMENT_STAFF"];
  if (staffRoles.includes(req.user.role) && !req.user.isStaffApproved) {
    return error(res, 403, "Forbidden. Your staff account is pending admin approval.");
  }
  next();
}

module.exports = { allowRoles, requireStaffApproval };
