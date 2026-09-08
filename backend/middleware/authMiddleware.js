const { verifyAccessToken } = require("../utils/jwt");
const User = require("../models/User");
const { error } = require("../utils/apiResponse");

/**
 * Verifies the Bearer token, loads the user, and attaches it to req.user.
 * Rejects if the token is missing, invalid, expired, or the account is deactivated.
 */
async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return error(res, 401, "Unauthorized. No token provided.");
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return error(res, 401, "Session expired. Please log in again.");
      }
      return error(res, 401, "Invalid token.");
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return error(res, 401, "Unauthorized. Account not found or deactivated.");
    }

    req.user = user;
    next();
  } catch (err) {
    return error(res, 500, "Authentication error.", [err.message]);
  }
}

module.exports = { protect };
