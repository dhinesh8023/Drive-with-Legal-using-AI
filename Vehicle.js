const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    vehicleType: {
      type: String,
      enum: ["TWO_WHEELER", "FOUR_WHEELER", "COMMERCIAL", "HEAVY_VEHICLE", "OTHER"],
      required: true,
    },
    brand: { type: String, trim: true },
    model: { type: String, trim: true },
    year: { type: Number },

    fastagId: { type: String, trim: true, sparse: true, unique: true, index: true },

    insurance: {
      provider: { type: String, trim: true },
      policyNumber: { type: String, trim: true },
      validTill: { type: Date },
    },

    registration: {
      rtoCode: { type: String, trim: true },
      registeredOn: { type: Date },
      validTill: { type: Date },
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
