const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { ROLES } = require("../config/constants");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },

    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
      required: true,
      index: true,
    },

    // Only relevant for POLICE / GOVERNMENT_STAFF roles
    officerId: { type: String, trim: true, sparse: true, unique: true, index: true },
    organizationId: { type: String, trim: true },
    department: { type: String, trim: true },
    designation: { type: String, trim: true },
    isStaffApproved: { type: Boolean, default: false }, // admin approval gate

    // Public profile
    address: { type: String, trim: true },
    dateOfBirth: { type: Date },
    licenseNumber: { type: String, trim: true },

    // AI safe driver score (0-100), recalculated by riskEngine over time
    safeDriverScore: { type: Number, default: 85, min: 0, max: 100 },

    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },

    // Password reset flow
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.index({ email: 1, role: 1 });

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("passwordHash")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
