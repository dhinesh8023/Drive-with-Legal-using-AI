const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const mockDataStore = require('../services/mockDataStore');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token required.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'drive_legal_ai_super_secret_jwt_key_sih2026_production_style');
    let user = null;

    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findById(decoded.id).select('-password');
      } catch (err) {
        // Fall back to mock store
      }
    }

    if (!user) {
      user = mockDataStore.findUserById(decoded.id);
    }

    if (!user) {
      // Create minimal fallback user from token payload
      user = {
        _id: decoded.id,
        id: decoded.id,
        name: 'Authorized User',
        role: decoded.role || 'USER',
        isActive: true,
      };
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact administrator.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please log in again.',
    });
  }
};

module.exports = { protect };
