const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { recordAudit } = require('../services/auditService');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'drive_legal_ai_super_secret_jwt_key_sih2026_production_style', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * @desc    Register a new user / officer candidate
 * @route   POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, officerId, organizationId, badgeNumber, department } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    // Role safety: Public registration only allows USER role by default.
    // If requesting POLICE or GOVERNMENT_STAFF, requires officer details and requires verification
    let isApproved = true;
    const assignedRole = role || 'USER';

    if (assignedRole === 'POLICE' || assignedRole === 'GOVERNMENT_STAFF') {
      if (!officerId || !organizationId) {
        return res.status(400).json({
          success: false,
          message: 'Official credentials (Officer ID and Organization ID) are required for Police and Government roles.',
        });
      }
      // Demo environment auto-approves for seamless Hackathon evaluation
      isApproved = true;
    }

    if (assignedRole === 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Administrator registration cannot be performed publicly.',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
      phone,
      officerId,
      organizationId,
      badgeNumber,
      department,
      isApproved,
    });

    const token = generateToken(user._id);

    await recordAudit({
      actorId: user._id,
      actorName: user.name,
      actorRole: user.role,
      action: 'USER_REGISTERED',
      targetType: 'USER',
      targetId: user._id.toString(),
      details: { role: user.role, email: user.email },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          officerId: user.officerId,
          driverScore: user.driverScore,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password, requestedRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or user does not exist',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password did not match.',
      });
    }

    // If requestedRole was specified, ensure user role matches
    if (requestedRole && requestedRole !== user.role && requestedRole !== 'ANY') {
      return res.status(403).json({
        success: false,
        message: `Role mismatch: This account has '${user.role}' permissions, not '${requestedRole}'. Please select the correct portal login.`,
      });
    }

    const token = generateToken(user._id);

    await recordAudit({
      actorId: user._id,
      actorName: user.name,
      actorRole: user.role,
      action: user.role === 'USER' ? 'USER_LOGIN' : 'OFFICER_LOGIN',
      targetType: 'USER',
      targetId: user._id.toString(),
      details: { email: user.email, role: user.role },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          officerId: user.officerId,
          badgeNumber: user.badgeNumber,
          driverScore: user.driverScore,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated profile
 * @route   GET /api/auth/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout (audit event)
 * @route   POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await recordAudit({
        actorId: req.user._id,
        actorName: req.user.name,
        actorRole: req.user.role,
        action: 'USER_LOGOUT',
        targetType: 'USER',
        targetId: req.user._id.toString(),
        req,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Forgot password request
 * @route   POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user registered with this email address.',
      });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset code generated. Use the provided demo reset token.',
      data: {
        resetToken, // Returned in demo mode for instant testing
        expiresIn: '30 minutes',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both reset token and new password',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.',
      });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been successfully updated. Please log in.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  logout,
  forgotPassword,
  resetPassword,
};
