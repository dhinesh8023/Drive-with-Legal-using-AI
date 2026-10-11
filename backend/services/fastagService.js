const FastagAccount = require('../models/FastagAccount');
const Vehicle = require('../models/Vehicle');
const fastagAdapter = require('./fastagProviderAdapter');
const { generateId } = require('../utils/helpers');

class FastagService {
  /**
   * Fetch FASTag account for user/vehicle
   */
  async getAccount(userId) {
    let account = await FastagAccount.findOne({ user: userId }).populate('vehicle');
    return account;
  }

  /**
   * Recharge FASTag wallet
   */
  async rechargeWallet(userId, amount) {
    if (!amount || amount <= 0) {
      throw new Error('Recharge amount must be greater than zero');
    }

    const account = await FastagAccount.findOne({ user: userId });
    if (!account) {
      throw new Error('No FASTag account registered for this user');
    }

    const txnId = generateId('FTX');
    account.currentBalance += Number(amount);
    if (account.currentBalance > account.lowBalanceThreshold) {
      account.status = 'ACTIVE';
    }

    account.transactions.unshift({
      transactionId: txnId,
      type: 'WALLET_RECHARGE',
      amount: Number(amount),
      description: `FASTag Top-Up via UPI/NetBanking`,
      plazaName: 'Online Top-up Gateway',
      balanceAfter: account.currentBalance,
      referenceId: `TOPUP_${Date.now()}`,
    });

    await account.save();
    return account;
  }

  /**
   * Deduct Fine or Toll from FASTag wallet
   */
  async debitAccount({ userId, amount, description, type = 'FINE_PAYMENT', plazaName = 'E-Challan Recovery Portal' }) {
    const account = await FastagAccount.findOne({ user: userId });
    if (!account) {
      throw new Error('FASTag account not found');
    }

    if (account.currentBalance < amount) {
      throw new Error(`Insufficient FASTag balance (Current: ₹${account.currentBalance}, Required: ₹${amount})`);
    }

    // Call adapter
    const adapterRes = await fastagAdapter.processDebit({
      fastagId: account.fastagId,
      amount,
      description,
    });

    const txnId = generateId('FTX');
    account.currentBalance -= Number(amount);
    if (account.currentBalance <= account.lowBalanceThreshold) {
      account.status = 'LOW_BALANCE';
    }

    account.transactions.unshift({
      transactionId: txnId,
      type,
      amount: Number(amount),
      description,
      plazaName,
      balanceAfter: account.currentBalance,
      referenceId: adapterRes.npciRefId,
    });

    await account.save();
    return { account, txnId, npciRef: adapterRes.npciRefId };
  }
}

module.exports = new FastagService();
