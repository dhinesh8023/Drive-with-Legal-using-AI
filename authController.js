const crypto = require("crypto");
const User = require("../models/User");
const { signAccessToken, signRefreshToken } = require("../utils/jwt");
const { success, error } = require("../utils/apiResponse");
const { ROLES, AUDIT_ACTIONS } = require("../config/constants");

/**
 * Public registration only ever creates USER accounts.
 * POLICE / GOVERNMENT_STAFF accounts require officerId + organizationId +
 * a valid STAFF_REGISTRATION_CODE, and start with isStaffApproved=false
 * until an ADMIN approves them (see adminController).
 */
async function register(req, res, next) {
  try {
    const { name, email, phone, password, role, officerId, organizationId, registrationCode } = req.body;

    if (!name || !email || !password) {
      return error(res, 400, "Name, email, and password are required.");
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return error(res, 409, "An account with this email already exists.");
    }

    let finalRole = ROLES.USER;
    let isStaffApproved = true;

    if (role === ROLES.POLICE || role === ROLES.GOVERNMENT_STAFF) {
      if (!officerId || !organizationId || !registrationCode) {
        return error(
          res,
          400,
          "Officer ID, Organization ID, and a valid registration code are required for staff accounts."
        );
      }
      if (registrationCode !== process.env.STAFF_REGISTRATION_CODE) {
        return error(res, 403, "Invalid staff registration code.");
      }
      finalRole = role;
      isStaffApproved = false; // still requires explicit admin approval
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash: password, // hashed by pre-save hook
      role: finalRole,
      officerId: finalRole !== ROLES.USER ? officerId : undefined,
      organizationId: finalRole !== ROLES.USER ? organizationId : undefined,
      isStaffApproved,
    });

    return success(res, 201, "Account created successfully.", {
      user: user.toSafeJSON(),
      requiresApproval: !isStaffApproved,
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return error(res, 400, "Email and password are required.");
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user || !user.isActive) {
      return error(res, 401, "Invalid credentials.");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return error(res, 401, "Invalid credentials.");
    }

    if ((user.role === ROLES.POLICE || user.role === ROLES.GOVERNMENT_STAFF) && !user.isStaffApproved) {
      return error(res, 403, "Your staff account is pending admin approval.");
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    if (req.logAudit) {
      await req.logAudit({ action: AUDIT_ACTIONS.LOGIN, targetType: "User", targetId: user._id });
    }

    return success(res, 200, "Login successful.", {
      user: user.toSafeJSON(),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    if (req.user && req.logAudit) {
      await req.logAudit({ action: AUDIT_ACTIONS.LOGOUT, targetType: "User", targetId: req.user._id });
    }
    // Stateless JWT: logout is enforced client-side by discarding the token.
    // A production system would additionally maintain a token blocklist.
    return success(res, 200, "Logged out successfully.");
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    return success(res, 200, "Profile fetched.", { user: req.user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });

    // Always respond the same way to avoid leaking whether an email exists.
    const genericMessage = "If an account exists for this email, a reset link has been generated.";

    if (!user) return success(res, 200, genericMessage);

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    // EMAIL_MODE=demo: log instead of sending a real email.
    if ((process.env.EMAIL_MODE || "demo") === "demo") {
      console.log(`[EMAIL-DEMO] Password reset token for ${user.email}: ${rawToken}`);
    }

    return success(res, 200, genericMessage, {
      demoResetToken: (process.env.EMAIL_MODE || "demo") === "demo" ? rawToken : undefined,
    });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return error(res, 400, "Token and new password are required.");
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+passwordHash +resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return error(res, 400, "Invalid or expired reset token.");
    }

    user.passwordHash = newPassword; // re-hashed by pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return success(res, 200, "Password reset successfully. Please log in with your new password.");
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, getProfile, forgotPassword, resetPassword };
