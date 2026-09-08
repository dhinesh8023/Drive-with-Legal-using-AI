const FineRule = require("../models/FineRule");
const { success, error } = require("../utils/apiResponse");

async function listFineRules(req, res, next) {
  try {
    const rules = await FineRule.find().sort({ violationType: 1 });
    return success(res, 200, "Fine rules fetched.", { rules });
  } catch (err) {
    next(err);
  }
}

async function upsertFineRule(req, res, next) {
  try {
    const { violationType, baseFineAmount, description, duePeriodDays, isActive } = req.body;
    if (!violationType || baseFineAmount === undefined) {
      return error(res, 400, "violationType and baseFineAmount are required.");
    }

    const rule = await FineRule.findOneAndUpdate(
      { violationType },
      {
        violationType,
        baseFineAmount,
        description,
        duePeriodDays,
        isActive: isActive !== undefined ? isActive : true,
        createdBy: req.user._id,
      },
      { upsert: true, new: true, runValidators: true }
    );

    return success(res, 200, "Fine rule saved.", { rule });
  } catch (err) {
    next(err);
  }
}

async function deleteFineRule(req, res, next) {
  try {
    const rule = await FineRule.findById(req.params.id);
    if (!rule) return error(res, 404, "Fine rule not found.");
    rule.isActive = false;
    await rule.save();
    return success(res, 200, "Fine rule deactivated.");
  } catch (err) {
    next(err);
  }
}

module.exports = { listFineRules, upsertFineRule, deleteFineRule };
