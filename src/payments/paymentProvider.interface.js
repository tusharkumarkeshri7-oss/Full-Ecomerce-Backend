/**
 * Abstract Payment Provider Interface
 * All payment gateway implementations must adhere to this interface
 */
export class PaymentProvider {
  /**
   * @param {string} name
   */
  constructor(name) {
    if (this.constructor === PaymentProvider) {
      throw new Error("Abstract class 'PaymentProvider' cannot be instantiated directly.");
    }
    this.name = name;
  }

  /**
   * Create a payment intent or order session
   * @param {object} params
   * @param {number} params.amount - Total amount in standard currency units (e.g. dollars)
   * @param {string} params.currency - 3-letter currency code (e.g. 'usd')
   * @param {string} params.orderId - System order ID
   * @param {string} params.customerEmail - Customer email address
   * @param {object} [params.metadata] - Extra metadata key-value pairs
   * @returns {Promise<{ transactionId: string, clientSecret: string, status: string, provider: string }>}
   */
  async createPaymentIntent(params) {
    throw new Error('createPaymentIntent() must be implemented.');
  }

  /**
   * Confirm or verify payment status
   * @param {string} transactionId
   * @param {object} [details]
   * @returns {Promise<{ transactionId: string, status: string, paidAt: Date }>}
   */
  async confirmPayment(transactionId, details = {}) {
    throw new Error('confirmPayment() must be implemented.');
  }

  /**
   * Refund a payment
   * @param {object} params
   * @param {string} params.transactionId
   * @param {number} [params.amount]
   * @param {string} [params.reason]
   * @returns {Promise<{ refundId: string, status: string }>}
   */
  async refundPayment(params) {
    throw new Error('refundPayment() must be implemented.');
  }

  /**
   * Verify and parse incoming webhook event payload
   * @param {object} params
   * @param {Buffer|string} params.rawBody
   * @param {string} params.signature
   * @returns {{ eventType: string, transactionId: string, orderId: string, status: string }}
   */
  verifyWebhookEvent(params) {
    throw new Error('verifyWebhookEvent() must be implemented.');
  }
}
