/**
 * WhatsApp Provider Adapter. DEMO MODE logs the message instead of sending it.
 * LIVE MODE would use the official WhatsApp Business API with approved
 * message templates and explicit user consent (WHATSAPP_API_TOKEN / WHATSAPP_PHONE_ID).
 */
function isDemoMode() {
  return (process.env.NOTIFICATION_MODE || "demo") !== "live";
}

async function sendWhatsApp({ toPhone, message }) {
  if (isDemoMode()) {
    console.log(`[WHATSAPP-DEMO] To: ${toPhone} | Message: ${message}`);
    return { success: true, isDemo: true, status: "SENT", providerRef: `DEMO-WA-${Date.now()}` };
  }

  if (!process.env.WHATSAPP_API_TOKEN || !process.env.WHATSAPP_PHONE_ID) {
    return { success: false, isDemo: false, status: "FAILED", reason: "WhatsApp Business API not configured" };
  }

  // LIVE MODE PLACEHOLDER — integrate WhatsApp Business API here.
  throw new Error("Live WhatsApp mode requires WhatsApp Business API integration.");
}

module.exports = { sendWhatsApp, isDemoMode };
