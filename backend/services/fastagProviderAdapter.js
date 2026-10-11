/**
 * FASTag Provider Adapter
 * Simulates NPCI National Electronic Toll Collection (NETC) Switch
 */
class FastagProviderAdapter {
  constructor() {
    this.mode = process.env.FASTAG_MODE || 'demo';
  }

  /**
   * Simulate balance query from central clearing house
   */
  async queryTagStatus(tagId) {
    return {
      status: 'ACTIVE',
      tagId,
      issuerBank: 'ICICI Bank NETC',
      vehicleClass: 'VC4 (Car / Jeep / Van)',
      lowBalanceWarning: false,
    };
  }

  /**
   * Process debit for toll or approved fine deduction
   */
  async processDebit({ fastagId, amount, referenceId, description }) {
    return {
      success: true,
      npciRefId: `NPCI_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      status: 'CLEARED',
      amount,
      settlementTime: new Date().toISOString(),
    };
  }
}

module.exports = new FastagProviderAdapter();
