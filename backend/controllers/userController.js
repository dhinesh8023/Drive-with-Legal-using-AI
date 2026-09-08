const User = require("../models/User");
const { success, error } = require("../utils/apiResponse");
const { AUDIT_ACTIONS, ROLES } = require("../config/constants");

/** ADMIN only: list users, optionally filtered by role. */
async function listUsers(req, res, next) {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).sort({ createdAt: -1 }).limit(200);
    return success(res, 200, "Users fetched.", { users: users.map((u) => u.toSafeJSON()), count: users.length });
  } catch (err) {
    next(err);
  }
}

/**
 * Advanced search for POLICE / GOVERNMENT_STAFF / ADMIN.
 * Every search is audited. Results are trimmed to fields appropriate
 * for the requester's role (government staff see less than police/admin).
 */
async function searchUsers(req, res, next) {
  try {
    const { name, email, phone, vehicleNumber, userId } = req.query;

    const filter = {};
    if (name) filter.name = { $regex: name, $options: "i" };
    if (email) filter.email = { $regex: email, $options: "i" };
    if (phone) filter.phone = { $regex: phone, $options: "i" };
    if (userId) filter._id = userId;

    let users = await User.find(filter).limit(50);

    if (vehicleNumber) {
      const Vehicle = require("../models/Vehicle");
      const vehicles = await Vehicle.find({ vehicleNumber: new RegExp(vehicleNumber, "i") });
      const ownerIds = vehicles.map((v) => v.owner.toString());
      users = users.filter((u) => ownerIds.includes(u._id.toString()));
      if (users.length === 0 && ownerIds.length > 0) {
        users = await User.find({ _id: { $in: ownerIds } });
      }
    }

    // Role-based field trimming: government staff get an aggregated view only.
    const isFullAccess = req.user.role === ROLES.POLICE || req.user.role === ROLES.ADMIN;
    const results = users.map((u) => {
      const safe = u.toSafeJSON();
      if (!isFullAccess) {
        return { _id: safe._id, name: safe.name, safeDriverScore: safe.safeDriverScore };
      }
      return safe;
    });

    if (req.logAudit) {
      await req.logAudit({
        action: AUDIT_ACTIONS.USER_SEARCH,
        targetType: "User",
        details: { name, email, phone, vehicleNumber, userId },
        resultCount: results.length,
      });
    }

    return success(res, 200, "Search completed.", { users: results, count: results.length });
  } catch (err) {
    next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return error(res, 404, "User not found.");

    // A regular user may only fetch their own profile this way.
    if (req.user.role === ROLES.USER && req.user._id.toString() !== user._id.toString()) {
      return error(res, 403, "Forbidden.");
    }

    return success(res, 200, "User fetched.", { user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return error(res, 404, "User not found.");

    if (req.user.role === ROLES.USER && req.user._id.toString() !== target._id.toString()) {
      return error(res, 403, "Forbidden.");
    }

    const editableFields = ["name", "phone", "address", "dateOfBirth", "licenseNumber"];
    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) target[field] = req.body[field];
    });

    // Only ADMIN can change role/approval/active status.
    if (req.user.role === ROLES.ADMIN) {
      if (req.body.role) target.role = req.body.role;
      if (req.body.isStaffApproved !== undefined) target.isStaffApproved = req.body.isStaffApproved;
      if (req.body.isActive !== undefined) target.isActive = req.body.isActive;
    }

    await target.save();
    return success(res, 200, "User updated.", { user: target.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, searchUsers, getUserById, updateUser };
