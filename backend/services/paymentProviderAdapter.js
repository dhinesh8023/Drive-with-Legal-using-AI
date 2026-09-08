const { v4: uuidv4 } = require("uuid");

/**
 * Payment Provider Adapter.
 *
 * DEMO MODE (default, PAYMENT_MODE=demo): simulates a payment provider
 * locally — no real money moves, no external network calls.
 *
 * LIVE MODE (PAYMENT_MODE=live): this is where a real, approved gateway
 * SDK (Razorpay/UPI PSP/etc.) would be wired in using PAYMENT_PROVIDER_KEY
 * and PAYMENT_PROVIDER_SECRET from environment variables. Never hardcode
 * credentials; never claim demo transactions are real settlements.
 */

function isDemoMode() {
  return (process.env.PAYMENT_MODE || "demo") !== "live";
}

/**
 * Initiates a payment. In demo mode, immediately returns a "PROCESSING"
 * reference that the caller can then verify (simulating async settlement).
 */
async function initiatePayment({ amount, method }) {
  if (isDemoMode()) {
    return {
      success: true,
      isDemo: true,
      transactionReference: `DEMO-TXN-${uuidv4().slice(0, 12).toUpperCase()}`,
      status: "PROCESSING",
      providerMessage: "Demo payment initiated. No real funds are involved.",
    };
  }

  // LIVE MODE PLACEHOLDER — integrate an approved gateway SDK here.
  throw new Error(
    "Live payment mode is not configured in this prototype. Set PAYMENT_MODE=demo, " +
      "or integrate an approved payment gateway adapter before enabling live mode."
  );
}

/**
 * Verifies a payment's final status. Demo mode simulates near-certain
 * success to keep the SIH demo flow smooth, but still models the
 * PROCESSING -> SUCCESS/FAILED state machine explicitly.
 */
async function verifyPayment({ transactionReference }) {
  if (isDemoMode()) {
    // Simulated verification: succeeds unless deliberately marked otherwise
    // by the caller (see paymentController for a "force fail" demo hook).
    return {
      success: true,
      isDemo: true,
      transactionReference,
      status: "SUCCESS",
      verifiedAt: new Date(),
    };
  }

  throw new Error("Live payment verification is not configured in this prototype.");
}

module.exports = { initiatePayment, verifyPayment, isDemoMode };
