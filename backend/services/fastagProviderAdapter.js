/**
 * FASTag Provider Adapter.
 *
 * DEMO MODE (default): all balances/transactions are simulated and stored
 * only in this application's own database (see models/FastagAccount.js).
 * This is NOT a connection to NHAI, any bank, or any official FASTag issuer.
 *
 * LIVE MODE: would require an authorized, contractual integration with a
 * licensed FASTag issuing bank or NPCI-approved aggregator. That integration
 * must never be represented as an official government/bank connection unless
 * it genuinely is one, and must be wired in via FASTAG_PROVIDER_API_KEY.
 */

function isDemoMode() {
  return (process.env.FASTAG_MODE || "demo") !== "live";
}

async function rechargeAccount({ currentBalance, amount }) {
  if (isDemoMode()) {
    return {
      success: true,
      isDemo: true,
      newBalance: currentBalance + amount,
      reference: `DEMO-FASTAG-RECHARGE-${Date.now()}`,
    };
  }
  throw new Error("Live FASTag mode is not configured in this prototype.");
}

async function deductForTollOrFine({ currentBalance, amount }) {
  if (isDemoMode()) {
    if (currentBalance < amount) {
      return { success: false, isDemo: true, reason: "Insufficient demo balance" };
    }
    return {
      success: true,
      isDemo: true,
      newBalance: currentBalance - amount,
      reference: `DEMO-FASTAG-DEDUCT-${Date.now()}`,
    };
  }
  throw new Error("Live FASTag mode is not configured in this prototype.");
}

module.exports = { isDemoMode, rechargeAccount, deductForTollOrFine };
