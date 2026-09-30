import { Order } from '../models/order.model.js';
import { AuditLog } from '../models/auditLog.model.js';
import { paymentFactory } from '../payments/paymentFactory.js';
import { ApiError } from '../utils/ApiError.js';
import { ORDER_STATUS, PAYMENT_STATUS } from '../constants/orderStatus.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export class PaymentService {
  /**
   * Initialize payment intent for an order
   */
  static async createPaymentIntent(orderId, currentUser) {
    const order = await Order.findById(orderId).populate('user', 'email name');
    if (!order) {
      throw ApiError.notFound('Order not found.');
    }

    if (order.user._id.toString() !== currentUser._id.toString() && currentUser.role !== 'admin') {
      throw ApiError.forbidden('Unauthorized access to this order.');
    }

    if (order.paymentInfo?.status === PAYMENT_STATUS.COMPLETED) {
      throw ApiError.badRequest('This order has already been paid.');
    }

    const providerName = order.paymentInfo?.method || env.payment.provider;
    const provider = paymentFactory.getProvider(providerName);

    const intent = await provider.createPaymentIntent({
      amount: order.totalPrice,
      currency: env.payment.currency,
      orderId: order._id.toString(),
      customerEmail: order.user.email,
      metadata: {
        orderNumber: order.orderNumber
      }
    });

    order.paymentInfo.transactionId = intent.transactionId;
    order.paymentInfo.clientSecret = intent.clientSecret;
    order.paymentInfo.method = intent.provider;
    await order.save();

    return {
      orderId: order._id,
      orderNumber: order.orderNumber,
      provider: intent.provider,
      transactionId: intent.transactionId,
      clientSecret: intent.clientSecret,
      amount: order.totalPrice,
      currency: env.payment.currency
    };
  }

  /**
   * Confirm payment completion (client or backend confirmation)
   */
  static async confirmPayment(orderId, paymentDetails, currentUser) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found.');
    }

    if (order.user.toString() !== currentUser._id.toString() && currentUser.role !== 'admin') {
      throw ApiError.forbidden('Unauthorized access to this order.');
    }

    if (order.paymentInfo.status === PAYMENT_STATUS.COMPLETED) {
      return { message: 'Order is already marked as paid.', order };
    }

    const providerName = order.paymentInfo?.method || env.payment.provider;
    const provider = paymentFactory.getProvider(providerName);

    const result = await provider.confirmPayment(
      order.paymentInfo.transactionId || paymentDetails?.transactionId,
      paymentDetails
    );

    if (result.status === PAYMENT_STATUS.COMPLETED) {
      order.paymentInfo.status = PAYMENT_STATUS.COMPLETED;
      order.paymentInfo.paidAt = result.paidAt || new Date();
      order.orderStatus = ORDER_STATUS.PAID;

      order.statusHistory.push({
        status: ORDER_STATUS.PAID,
        changedAt: new Date(),
        note: `Payment confirmed via ${providerName}. Transaction: ${order.paymentInfo.transactionId}`
      });

      await order.save();

      await AuditLog.create({
        action: 'PAYMENT_COMPLETED',
        performedBy: currentUser._id,
        entityType: 'payment',
        entityId: order._id.toString(),
        details: { provider: providerName, transactionId: order.paymentInfo.transactionId }
      });
    } else {
      order.paymentInfo.status = PAYMENT_STATUS.FAILED;
      await order.save();
    }

    return {
      orderId: order._id,
      paymentStatus: order.paymentInfo.status,
      orderStatus: order.orderStatus,
      transactionId: order.paymentInfo.transactionId
    };
  }

  /**
   * Handle incoming asynchronous webhook events from payment gateway
   */
  static async handleWebhook(rawBody, signature, providerName = env.payment.provider) {
    const provider = paymentFactory.getProvider(providerName);
    const event = provider.verifyWebhookEvent({ rawBody, signature });

    logger.info(`[Payment Webhook] Received ${event.eventType} for tx: ${event.transactionId}`);

    let order = null;
    if (event.orderId) {
      order = await Order.findById(event.orderId);
    }
    if (!order && event.transactionId) {
      order = await Order.findOne({ 'paymentInfo.transactionId': event.transactionId });
    }

    if (!order) {
      logger.warn(`[Payment Webhook] No matching order found for transaction ${event.transactionId}`);
      return { received: true, processed: false };
    }

    if (event.status === PAYMENT_STATUS.COMPLETED && order.orderStatus === ORDER_STATUS.PENDING) {
      order.paymentInfo.status = PAYMENT_STATUS.COMPLETED;
      order.paymentInfo.paidAt = new Date();
      order.orderStatus = ORDER_STATUS.PAID;

      order.statusHistory.push({
        status: ORDER_STATUS.PAID,
        changedAt: new Date(),
        note: `Payment succeeded via Webhook (${providerName})`
      });

      await order.save();

      await AuditLog.create({
        action: 'PAYMENT_WEBHOOK_SUCCESS',
        performedBy: null,
        entityType: 'payment',
        entityId: order._id.toString(),
        details: { eventType: event.eventType, transactionId: event.transactionId }
      });
    }

    return { received: true, processed: true, orderId: order._id };
  }

  /**
   * Admin: Refund order payment
   */
  static async refundOrder(orderId, { reason }, adminUser) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found.');
    }

    if (order.paymentInfo.status !== PAYMENT_STATUS.COMPLETED) {
      throw ApiError.badRequest('Cannot refund an unpaid order.');
    }

    const providerName = order.paymentInfo.method || env.payment.provider;
    const provider = paymentFactory.getProvider(providerName);

    const refund = await provider.refundPayment({
      transactionId: order.paymentInfo.transactionId,
      amount: order.totalPrice,
      reason
    });

    order.paymentInfo.status = PAYMENT_STATUS.REFUNDED;
    order.orderStatus = ORDER_STATUS.REFUNDED;

    order.statusHistory.push({
      status: ORDER_STATUS.REFUNDED,
      changedAt: new Date(),
      note: `Refund processed: ${reason}`,
      updatedBy: adminUser._id
    });

    await order.save();

    await AuditLog.create({
      action: 'PAYMENT_REFUNDED',
      performedBy: adminUser._id,
      entityType: 'payment',
      entityId: order._id.toString(),
      details: { refundId: refund.refundId, reason }
    });

    return { order, refund };
  }
}
