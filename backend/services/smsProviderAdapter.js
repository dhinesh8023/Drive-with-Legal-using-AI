/**
 * SMS Provider Adapter. DEMO MODE logs the message instead of sending it.
 * LIVE MODE would call an approved SMS gateway using SMS_API_KEY.
 */
function isDemoMode() {
  return (process.env.NOTIFICATION_MODE || "demo") !== "live";
}

async function sendSms({ toPhone, message }) {
  if (isDemoMode()) {
    console.log(`[SMS-DEMO] To: ${toPhone} | Message: ${message}`);
    return { success: true, isDemo: true, status: "SENT", providerRef: `DEMO-SMS-${Date.now()}` };
  }

  if (!process.env.SMS_API_KEY) {
    return { success: false, isDemo: false, status: "FAILED", reason: "SMS_API_KEY not configured" };
  }

  // LIVE MODE PLACEHOLDER — integrate an approved SMS gateway here.
  throw new Error("Live SMS mode requires an approved gateway integration.");
}

module.exports = { sendSms, isDemoMode };
