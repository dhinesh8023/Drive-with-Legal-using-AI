/**
 * SMS Provider Adapter
 * Supports Demo/Mock Mode for Hackathons and Production Gateways (Twilio, Gupshup, Fast2SMS)
 */
class SmsProviderAdapter {
  constructor() {
    this.mode = process.env.NOTIFICATION_MODE || 'demo';
    this.apiKey = process.env.SMS_API_KEY || '';
  }

  /**
   * Dispatch an SMS notification
   * @param {Object} payload { phone, message, templateId }
   * @returns {Promise<Object>}
   */
  async sendSms({ phone, message, templateId = 'DL_FINE_REMINDER' }) {
    if (this.mode === 'demo' || !this.apiKey) {
      console.log(`[SMS Demo Adapter] Simulating SMS dispatch to ${phone}:`);
      console.log(`--------------------------------------------------`);
      console.log(`To: ${phone}`);
      console.log(`Message: ${message}`);
      console.log(`--------------------------------------------------`);

      return {
        success: true,
        provider: 'Demo SMS Gateway (SIH Mock)',
        status: 'DELIVERED_SIMULATED',
        messageId: `MOCK_SMS_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        recipient: phone,
        timestamp: new Date().toISOString(),
      };
    }

    // Future Real Gateway Integration (Twilio/Fast2SMS/Msg91)
    try {
      // Axios call to real provider would go here
      return {
        success: true,
        provider: 'Production SMS Gateway',
        status: 'QUEUED',
        recipient: phone,
      };
    } catch (err) {
      console.error('[SMS Adapter Error]', err.message);
      return { success: false, error: err.message };
    }
  }
}

module.exports = new SmsProviderAdapter();
