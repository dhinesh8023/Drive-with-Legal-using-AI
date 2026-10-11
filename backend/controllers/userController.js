const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Violation = require('../models/Violation');
const Fine = require('../models/Fine');
const { recordAudit } = require('../services/auditService');

/**
 * @desc    Get users list (Admin / Government / Police)
 * @route   GET /api/users
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, limit = 50, page = 1 } = req.query;
    const query = {};
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Advanced User Search with Mandatory Legal Audit Trail
 * @route   GET /api/users/search
 */
const searchUsers = async (req, res, next) => {
  try {
    const {
      name,
      vehicleNumber,
      phone,
      email,
      userId,
      violationId,
      vehicleType,
      status,
    } = req.query;

    const filter = { role: 'USER' };

    if (name) filter.name = { $regex: name, $options: 'i' };
    if (phone) filter.phone = { $regex: phone, $options: 'i' };
    if (email) filter.email = { $regex: email, $options: 'i' };
    if (userId) filter._id = userId;

    let matchedUserIds = [];

    // Search by vehicle number or type
    if (vehicleNumber || vehicleType) {
      const vQuery = {};
      if (vehicleNumber) vQuery.vehicleNumber = { $regex: vehicleNumber, $options: 'i' };
      if (vehicleType) vQuery.vehicleType = vehicleType;
      const vehicles = await Vehicle.find(vQuery).select('user');
      matchedUserIds = vehicles.map((v) => v.user);
      if (matchedUserIds.length > 0) {
        filter._id = { $in: matchedUserIds };
      }
    }

    // Search by violation ID
    if (violationId) {
      const vio = await Violation.findOne({ violationId }).select('user');
      if (vio && vio.user) {
        filter._id = vio.user;
      }
    }

    const results = await User.find(filter)
      .select('-password')
      .limit(25);

    // Audit Search Execution
    await recordAudit({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'USER_SEARCH',
      targetType: 'SEARCH',
      targetId: vehicleNumber || email || phone || name || 'ADVANCED_QUERY',
      details: {
        query: req.query,
        resultCount: results.length,
      },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Search query evaluated with audit tracking',
      resultCount: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single user details by ID
 * @route   GET /api/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    // Normal users can only see their own profile
    if (req.user.role === 'USER' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to commuter record.',
      });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Attach vehicles and recent violation summary
    const vehicles = await Vehicle.find({ user: user._id });
    const pendingFines = await Fine.find({ user: user._id, status: 'PENDING' });

    res.status(200).json({
      success: true,
      data: {
        user,
        vehicles,
        pendingFinesCount: pendingFines.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    if (req.user.role === 'USER' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only edit your own profile.',
      });
    }

    const allowedUpdates = ['name', 'phone', 'emergencyContacts', 'driverScore'];
    const updateData = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  searchUsers,
  getUserById,
  updateUser,
};
