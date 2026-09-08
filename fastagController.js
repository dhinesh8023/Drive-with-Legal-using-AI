const FastagAccount = require("../models/FastagAccount");
const Vehicle = require("../models/Vehicle");
const Fine = require("../models/Fine");
const { success, error } = require("../utils/apiResponse");
const { rechargeAccount, deductForTollOrFine } = require("../services/fastagProviderAdapter");
const { FINE_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } = require("../config/constants");
const Payment = require("../models/Payment");

async function getMyFastag(req, res, next) {
  try {
    const accounts = await FastagAccount.find({ user: req.user._id }).populate("vehicle", "vehicleNumber");
    return success(res, 200, "FASTag accounts fetched.", { accounts });
  } catch (err) {
    next(err);
  }
}

async function linkFastag(req, res, next) {
  try {
    const { vehicleId, fastagId } = req.body;
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return error(res, 404, "Vehicle not found.");
    if (vehicle.owner.toString() !== req.user._id.toString()) return error(res, 403, "Forbidden.");

    const existing = await FastagAccount.findOne({ vehicle: vehicleId });
    if (existing) return error(res, 409, "This vehicle already has a linked FASTag account.");

    const account = await FastagAccount.create({
      user: req.user._id,
      vehicle: vehicleId,
      fastagId: fastagId || `DEMO-FASTAG-${Date.now()}`,
      demoBalance: 500,
      isDemo: true,
    });

    return success(res, 201, "FASTag linked (demo mode).", { account });
  } catch (err) {
    next(err);
  }
}

async function rechargeFastag(req, res, next) {
  try {
    const { accountId, amount } = req.body;
    if (!amount || amount <= 0) return error(res, 400, "A valid recharge amount is required.");

    const account = await FastagAccount.findById(accountId);
    if (!account) return error(res, 404, "FASTag account not found.");
    if (account.user.toString() !== req.user._id.toString()) return error(res, 403, "Forbidden.");

    const result = await rechargeAccount({ currentBalance: account.demoBalance, amount });

    account.demoBalance = result.newBalance;
    account.transactions.push({
      type: "RECHARGE",
      amount,
      description: "Demo wallet recharge",
      balanceAfter: result.newBalance,
      reference: result.reference,
    });
    await account.save();

    return success(res, 200, "FASTag recharged (demo mode).", { account });
  } catch (err) {
    next(err);
  }
}

async function listTransactions(req, res, next) {
  try {
    const account = await FastagAccount.findById(req.params.accountId);
    if (!account) return error(res, 404, "FASTag account not found.");
    if (account.user.toString() !== req.user._id.toString()) return error(res, 403, "Forbidden.");

    return success(res, 200, "Transactions fetched.", {
      transactions: account.transactions.slice().reverse(),
    });
  } catch (err) {
    next(err);
  }
}

/** Pay a fine directly from FASTag demo balance. */
async function payFineWithFastag(req, res, next) {
  try {
    const { accountId, fineId } = req.body;
    const account = await FastagAccount.findById(accountId);
    const fine = await Fine.findById(fineId);

    if (!account || !fine) return error(res, 404, "Account or fine not found.");
    if (account.user.toString() !== req.user._id.toString()) return error(res, 403, "Forbidden.");
    if (fine.status === FINE_STATUS.PAID) return error(res, 400, "Fine already paid.");

    const result = await deductForTollOrFine({ currentBalance: account.demoBalance, amount: fine.amount });
    if (!result.success) return error(res, 400, "Insufficient FASTag demo balance.");

    account.demoBalance = result.newBalance;
    account.transactions.push({
      type: "FINE_PAYMENT",
      amount: fine.amount,
      description: `Fine payment: ${fine.fineCode}`,
      balanceAfter: result.newBalance,
      reference: result.reference,
    });
    await account.save();

    const payment = await Payment.create({
      fine: fine._id,
      user: req.user._id,
      amount: fine.amount,
      method: PAYMENT_METHODS.FASTAG,
      transactionReference: result.reference,
      status: PAYMENT_STATUS.SUCCESS,
      verifiedAt: new Date(),
      verifiedBy: "FASTAG_DEMO",
      isDemo: true,
    });

    fine.status = FINE_STATUS.PAID;
    fine.payment = payment._id;
    await fine.save();

    return success(res, 200, "Fine paid via FASTag (demo mode).", { account, payment, fine });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyFastag, linkFastag, rechargeFastag, listTransactions, payFineWithFastag };
