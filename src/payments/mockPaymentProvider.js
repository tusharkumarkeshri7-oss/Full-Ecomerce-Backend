import crypto from 'crypto';
import { PaymentProvider } from './paymentProvider.interface.js';
import { PAYMENT_STATUS } from '../constants/orderStatus.js';
import { logger } from '../config/logger.js';

/**
 * Mock Payment Provider
 * Allows full local testing of the checkout and payment lifecycle without third-party credentials
 */
export class MockPaymentProvider extends PaymentProvider {
  constructor() {
    super('mock');
    logger.info('Initialized Mock Payment Provider (Test/Offline mode active)');
  }

  async createPaymentIntent({ amount, currency = 'usd', orderId, customerEmail, metadata = {} }) {
    const transactionId = `mock_pi_${crypto.randomBytes(12).toString('hex')}`;
    const clientSecret = `${transactionId}_secret_${crypto.randomBytes(8).toString('hex')}`;

    logger.info(`[MockPayment] Created Intent for Order: ${orderId}, Amount: $${amount} ${currency.toUpperCase()}`);

    return {
      provider: 'mock',
      transactionId,
      clientSecret,
      status: PAYMENT_STATUS.PENDING,
      amount,
      currency
    };
  }

  async confirmPayment(transactionId, details = {}) {
    // If details.forceFail is set, simulate payment decline
    const isSuccess = details.forceFail !== true;

    logger.info(`[MockPayment] Confirming transaction ${transactionId}: ${isSuccess ? 'SUCCESS' : 'FAILED'}`);

    return {
      provider: 'mock',
      transactionId,
      status: isSuccess ? PAYMENT_STATUS.COMPLETED : PAYMENT_STATUS.FAILED,
      paidAt: isSuccess ? new Date() : null,
      message: isSuccess ? 'Mock payment approved successfully' : 'Mock payment was declined'
    };
  }

  async refundPayment({ transactionId, amount, reason = 'requested_by_customer' }) {
    const refundId = `mock_re_${crypto.randomBytes(12).toString('hex')}`;

    logger.info(`[MockPayment] Refunded ${transactionId}, Refund ID: ${refundId}, Reason: ${reason}`);

    return {
      provider: 'mock',
      refundId,
      transactionId,
      amount,
      status: PAYMENT_STATUS.REFUNDED,
      refundedAt: new Date()
    };
  }

  verifyWebhookEvent({ rawBody, signature }) {
    let payload;
    try {
      payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    } catch {
      payload = rawBody;
    }

    return {
      provider: 'mock',
      eventType: payload.type || 'payment_intent.succeeded',
      transactionId: payload.data?.transactionId || payload.transactionId || 'mock_tx_webhook',
      orderId: payload.data?.orderId || payload.orderId,
      status: PAYMENT_STATUS.COMPLETED
    };
  }
}
