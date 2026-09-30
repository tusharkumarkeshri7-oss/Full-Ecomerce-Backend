import { env } from '../config/env.js';
import { MockPaymentProvider } from './mockPaymentProvider.js';
import { StripePaymentProvider } from './stripePaymentProvider.js';
import { logger } from '../config/logger.js';

class PaymentFactory {
  constructor() {
    this.providers = new Map();
  }

  /**
   * Get a payment provider instance by name, or the active configured provider
   * @param {string} [providerName]
   * @returns {import('./paymentProvider.interface.js').PaymentProvider}
   */
  getProvider(providerName) {
    const selected = providerName || env.payment.provider;

    if (this.providers.has(selected)) {
      return this.providers.get(selected);
    }

    let instance;

    if (selected === 'stripe') {
      if (!env.payment.stripeSecretKey || env.payment.stripeSecretKey.startsWith('sk_test_placeholder')) {
        logger.warn('Stripe secret key missing or placeholder. Falling back to MockPaymentProvider.');
        instance = new MockPaymentProvider();
      } else {
        instance = new StripePaymentProvider();
      }
    } else {
      instance = new MockPaymentProvider();
    }

    this.providers.set(selected, instance);
    return instance;
  }
}

export const paymentFactory = new PaymentFactory();
