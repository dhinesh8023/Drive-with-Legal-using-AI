const FastagAccount = require('../models/FastagAccount');
const Vehicle = require('../models/Vehicle');
const fastagService = require('../services/fastagService');
const { generateId } = require('../utils/helpers');

/**
 * @desc    Get FASTag account for logged-in commuter
 * @route   GET /api/fastag
 */
const getFastag = async (req, res, next) => {
  try {
    let account = await FastagAccount.findOne({ user: req.user._id }).populate('vehicle');

    // If no account yet, check if user has a vehicle and auto-initialize demo FASTag
    if (!account) {
      const vehicle = await Vehicle.findOne({ user: req.user._id });
      if (vehicle) {
        account = await FastagAccount.create({
          fastagId: vehicle.fastagId || `NETC-${vehicle.vehicleNumber.replace(/\s+/g, '')}`,
          user: req.user._id,
          vehicle: vehicle._id,
          vehicleNumber: vehicle.vehicleNumber,
          currentBalance: 2500,
          transactions: [
            {
              transactionId: generateId('FTX'),
              type: 'WALLET_RECHARGE',
              amount: 2500,
              description: 'Initial Wallet Balance',
              plazaName: 'NETC National Clearing Hub',
              balanceAfter: 2500,
            },
          ],
        });
      }
    }

    res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Link FASTag ID to vehicle
 * @route   POST /api/fastag/link
 */
const linkFastag = async (req, res, next) => {
  try {
    const { vehicleId, fastagId } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    vehicle.fastagId = fastagId;
    await vehicle.save();

    let account = await FastagAccount.findOne({ vehicle: vehicle._id });
    if (account) {
      account.fastagId = fastagId;
      await account.save();
    } else {
      account = await FastagAccount.create({
        fastagId,
        user: req.user._id,
        vehicle: vehicle._id,
        vehicleNumber: vehicle.vehicleNumber,
        currentBalance: 1500,
        transactions: [
          {
            transactionId: generateId('FTX'),
            type: 'WALLET_RECHARGE',
            amount: 1500,
            description: 'Account Association Balance',
            plazaName: 'NETC National Clearing Hub',
            balanceAfter: 1500,
          },
        ],
      });
    }

    res.status(200).json({
      success: true,
      message: 'FASTag successfully linked to vehicle',
      data: account,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Recharge FASTag Wallet
 * @route   POST /api/fastag/recharge
 */
const rechargeFastag = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const account = await fastagService.rechargeWallet(req.user._id, amount);

    res.status(200).json({
      success: true,
      message: `FASTag wallet recharged with ₹${amount}`,
      data: account,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get FASTag Transaction History
 * @route   GET /api/fastag/transactions
 */
const getTransactions = async (req, res, next) => {
  try {
    const account = await FastagAccount.findOne({ user: req.user._id });
    if (!account) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    res.status(200).json({
      success: true,
      count: account.transactions.length,
      data: account.transactions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFastag,
  linkFastag,
  rechargeFastag,
  getTransactions,
};
