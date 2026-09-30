import { Order } from '../models/order.model.js';
import { Cart } from '../models/cart.model.js';
import { AuditLog } from '../models/auditLog.model.js';
import { ProductService } from './product.service.js';
import { ApiError } from '../utils/ApiError.js';
import { QueryFeatures } from '../utils/queryFeatures.js';
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  isValidOrderTransition
} from '../constants/orderStatus.js';
import { ROLES } from '../constants/roles.js';

export class OrderService {
  /**
   * Checkout: Create order from active user's cart
   */
  static async createOrderFromCart(userId, { shippingAddress, paymentMethod = PAYMENT_METHODS.MOCK }) {
    const cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      throw ApiError.badRequest('Cannot checkout with an empty shopping cart.');
    }

    // Build line items snapshot and verify all products exist & are active
    const orderItems = [];
    for (const item of cart.items) {
      const product = item.product;
      if (!product || !product.isActive) {
        throw ApiError.badRequest(
          `Product '${item.product?._id || 'unknown'}' is no longer available. Please update your cart.`
        );
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        image: product.images?.[0] || '',
        price: item.price,
        quantity: item.quantity,
        selectedAttributes: item.selectedAttributes
      });
    }

    // Atomically reserve/deduct inventory across all order items
    await ProductService.atomicDeductStock(orderItems);

    // Generate unique human-readable order number
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderNumber = `ORD-${datePrefix}-${randomSuffix}`;

    try {
      const order = await Order.create({
        orderNumber,
        user: userId,
        items: orderItems,
        shippingAddress,
        paymentInfo: {
          method: paymentMethod,
          status: PAYMENT_STATUS.PENDING
        },
        itemsPrice: cart.subtotal,
        taxPrice: cart.tax,
        shippingPrice: cart.shippingFee,
        totalPrice: cart.totalPrice,
        orderStatus: ORDER_STATUS.PENDING,
        statusHistory: [
          {
            status: ORDER_STATUS.PENDING,
            changedAt: new Date(),
            note: 'Order placed by customer'
          }
        ]
      });

      // Clear user cart upon successful order creation
      cart.items = [];
      cart.calculateTotals();
      await cart.save();

      // Write audit log
      await AuditLog.create({
        action: 'ORDER_CREATED',
        performedBy: userId,
        entityType: 'order',
        entityId: order._id.toString(),
        details: { orderNumber: order.orderNumber, totalPrice: order.totalPrice }
      });

      return order;
    } catch (err) {
      // Rollback deducted stock if order document creation fails
      await ProductService.restoreStock(orderItems);
      throw err;
    }
  }

  /**
   * Get single order by ID
   */
  static async getOrderById(orderId, currentUser) {
    const order = await Order.findById(orderId).populate('user', 'name email phone');
    if (!order) {
      throw ApiError.notFound('Order not found.');
    }

    // Authorization check: must be owner or admin/seller
    const isOwner = order.user._id.toString() === currentUser._id.toString();
    const isStaff = [ROLES.ADMIN, ROLES.SELLER].includes(currentUser.role);

    if (!isOwner && !isStaff) {
      throw ApiError.forbidden('You are not authorized to view this order.');
    }

    return order;
  }

  /**
   * Get orders belonging to authenticated user
   */
  static async getMyOrders(userId, queryString) {
    const features = new QueryFeatures(Order.find({ user: userId }), queryString)
      .filter()
      .sort('-createdAt')
      .limitFields();

    await features.paginate(Order);
    const orders = await features.mongooseQuery;

    return { orders, pagination: features.paginationMeta };
  }

  /**
   * Admin: Get all orders across the system
   */
  static async getAllOrders(queryString) {
    const features = new QueryFeatures(Order.find(), queryString)
      .filter()
      .sort('-createdAt')
      .limitFields();

    await features.paginate(Order);
    const orders = await features.mongooseQuery.populate('user', 'name email');

    return { orders, pagination: features.paginationMeta };
  }

  /**
   * Admin: Transition order status adhering to the order lifecycle state machine
   */
  static async updateOrderStatus(orderId, { status, note, trackingNumber }, adminUser) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found.');
    }

    // Verify valid state transition
    if (order.orderStatus !== status && !isValidOrderTransition(order.orderStatus, status)) {
      throw ApiError.badRequest(
        `Invalid status transition from '${order.orderStatus}' to '${status}'.`
      );
    }

    // If transitioning to CANCELLED, restore inventory
    if (status === ORDER_STATUS.CANCELLED && order.orderStatus !== ORDER_STATUS.CANCELLED) {
      await ProductService.restoreStock(order.items);
      order.cancelledAt = new Date();
      order.cancellationReason = note || 'Cancelled by administrator';
    }

    if (status === ORDER_STATUS.DELIVERED) {
      order.deliveredAt = new Date();
    }

    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    order.orderStatus = status;
    order.statusHistory.push({
      status,
      changedAt: new Date(),
      note: note || `Status updated to ${status}`,
      updatedBy: adminUser._id
    });

    await order.save();

    await AuditLog.create({
      action: 'ORDER_STATUS_UPDATED',
      performedBy: adminUser._id,
      entityType: 'order',
      entityId: order._id.toString(),
      details: { previousStatus: order.orderStatus, newStatus: status, note }
    });

    return order;
  }

  /**
   * Customer: Cancel pending or placed order
   */
  static async cancelOrder(orderId, currentUser, reason) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found.');
    }

    const isOwner = order.user.toString() === currentUser._id.toString();
    const isAdmin = currentUser.role === ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden('You do not have permission to cancel this order.');
    }

    const cancellableStatuses = [ORDER_STATUS.PENDING, ORDER_STATUS.PAID];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      throw ApiError.badRequest(
        `Order cannot be cancelled in its current state ('${order.orderStatus}'). Please contact support.`
      );
    }

    // Restore stock
    await ProductService.restoreStock(order.items);

    order.orderStatus = ORDER_STATUS.CANCELLED;
    order.cancelledAt = new Date();
    order.cancellationReason = reason;

    order.statusHistory.push({
      status: ORDER_STATUS.CANCELLED,
      changedAt: new Date(),
      note: `Cancelled: ${reason}`,
      updatedBy: currentUser._id
    });

    await order.save();

    await AuditLog.create({
      action: 'ORDER_CANCELLED',
      performedBy: currentUser._id,
      entityType: 'order',
      entityId: order._id.toString(),
      details: { reason }
    });

    return order;
  }
}
