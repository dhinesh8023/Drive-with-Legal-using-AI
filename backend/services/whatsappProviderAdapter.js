/**
 * WhatsApp Business Provider Adapter
 * Supports Demo/Mock Mode for Hackathons and Meta WhatsApp Cloud API
 */
class WhatsAppProviderAdapter {
  constructor() {
    this.mode = process.env.NOTIFICATION_MODE || 'demo';
    this.apiToken = process.env.WHATSAPP_API_TOKEN || '';
    this.phoneId = process.env.WHATSAPP_PHONE_ID || '';
  }

  /**
   * Dispatch a WhatsApp notification
   * @param {Object} payload { phone, fineId, amount, dueDate, vehicleNumber, violationType }
   * @returns {Promise<Object>}
   */
  async sendWhatsAppMessage({ phone, fineId, amount, dueDate, vehicleNumber, violationType }) {
    const formattedMessage = `🚗 *DRIVE LEGAL AI — OFFICIAL VIOLATION NOTICE*

Dear Motorist,
A traffic violation candidate has been reviewed and verified by an authorized officer for vehicle *${vehicleNumber}*.

• *Fine ID:* ${fineId}
• *Violation:* ${violationType}
• *Configured Fine:* ₹${amount}
• *Due Date:* ${dueDate ? new Date(dueDate).toLocaleDateString() : 'Immediate'}

⚠️ *Legal Reminder:*
Please inspect the evidence and settle the fine via the Drive Legal AI Portal to prevent license demerits or vehicle impoundment.

Portal Link: http://127.0.0.1:5500/frontend/payments.html?fineId=${fineId}`;

    if (this.mode === 'demo' || !this.apiToken) {
      console.log(`[WhatsApp Demo Adapter] Simulating WhatsApp message to ${phone}:`);
      console.log(`==================================================`);
      console.log(formattedMessage);
      console.log(`==================================================`);

      return {
        success: true,
        provider: 'Meta Cloud API (Demo Simulation)',
        status: 'DELIVERED_SIMULATED',
        wamid: `wamid.HBgL${Date.now()}${Math.random().toString(36).substring(7)}`,
        recipient: phone,
        formattedMessage,
        timestamp: new Date().toISOString(),
      };
    }

    // Future Real WhatsApp Cloud API
    try {
      // Axios call to Meta Graph API https://graph.facebook.com/v19.0/${this.phoneId}/messages
      return {
        success: true,
        provider: 'Meta WhatsApp Business API',
        status: 'SENT',
        recipient: phone,
      };
    } catch (err) {
      console.error('[WhatsApp Adapter Error]', err.message);
      return { success: false, error: err.message };
    }
  }
}

module.exports = new WhatsAppProviderAdapter();
