import Stripe from 'stripe';
import { PaymentProvider } from './paymentProvider.interface.js';
import { PAYMENT_STATUS } from '../constants/orderStatus.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Stripe Payment Provider
 * Production integration with Stripe Payments API
 */
export class StripePaymentProvider extends PaymentProvider {
  constructor() {
    super('stripe');
    if (!env.payment.stripeSecretKey) {
      logger.warn('Stripe secret key not provided. Stripe calls will fail until configured.');
    }
    this.stripe = new Stripe(env.payment.stripeSecretKey || 'sk_test_dummy', {
      apiVersion: '2024-12-18.acacia'
    });
  }

  async createPaymentIntent({ amount, currency = 'usd', orderId, customerEmail, metadata = {} }) {
    try {
      // Stripe expects integer amounts in lowest currency denomination (e.g. cents)
      const amountInCents = Math.round(amount * 100);

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        receipt_email: customerEmail,
        metadata: {
          orderId: orderId.toString(),
          ...metadata
        },
        automatic_payment_methods: {
          enabled: true
        }
      });

      logger.info(`[Stripe] Created PaymentIntent ${paymentIntent.id} for Order: ${orderId}`);

      return {
        provider: 'stripe',
        transactionId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: PAYMENT_STATUS.PENDING,
        amount,
        currency
      };
    } catch (error) {
      logger.error('[Stripe] Failed to create payment intent:', error);
      throw ApiError.badRequest(`Stripe Error: ${error.message}`);
    }
  }

  async confirmPayment(transactionId) {
    try {
      const intent = await this.stripe.paymentIntents.retrieve(transactionId);
      const isSuccess = intent.status === 'succeeded';

      return {
        provider: 'stripe',
        transactionId: intent.id,
        status: isSuccess ? PAYMENT_STATUS.COMPLETED : PAYMENT_STATUS.FAILED,
        paidAt: isSuccess ? new Date(intent.created * 1000) : null,
        message: `Stripe Payment status is ${intent.status}`
      };
    } catch (error) {
      logger.error(`[Stripe] Error retrieving PaymentIntent ${transactionId}:`, error);
      throw ApiError.badRequest(`Stripe Error: ${error.message}`);
    }
  }

  async refundPayment({ transactionId, amount, reason = 'requested_by_customer' }) {
    try {
      const refundParams = {
        payment_intent: transactionId,
        reason
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100);
      }

      const refund = await this.stripe.refunds.create(refundParams);

      logger.info(`[Stripe] Processed refund ${refund.id} for transaction ${transactionId}`);

      return {
        provider: 'stripe',
        refundId: refund.id,
        transactionId,
        amount: refund.amount / 100,
        status: PAYMENT_STATUS.REFUNDED,
        refundedAt: new Date(refund.created * 1000)
      };
    } catch (error) {
      logger.error(`[Stripe] Refund error for ${transactionId}:`, error);
      throw ApiError.badRequest(`Stripe Refund Error: ${error.message}`);
    }
  }

  verifyWebhookEvent({ rawBody, signature }) {
    try {
      if (!env.payment.stripeWebhookSecret) {
        throw new Error('Stripe webhook secret is not configured in environment.');
      }

      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        env.payment.stripeWebhookSecret
      );

      const intent = event.data.object;
      let status = PAYMENT_STATUS.PENDING;

      if (event.type === 'payment_intent.succeeded') {
        status = PAYMENT_STATUS.COMPLETED;
      } else if (event.type === 'payment_intent.payment_failed') {
        status = PAYMENT_STATUS.FAILED;
      }

      return {
        provider: 'stripe',
        eventType: event.type,
        transactionId: intent.id,
        orderId: intent.metadata?.orderId,
        status
      };
    } catch (error) {
      logger.error('[Stripe Webhook] Signature verification failed:', error.message);
      throw ApiError.badRequest(`Webhook verification error: ${error.message}`);
    }
  }
}
