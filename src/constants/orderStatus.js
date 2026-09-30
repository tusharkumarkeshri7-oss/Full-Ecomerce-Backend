/**
 * Order Lifecycle Statuses & State Machine
 */
export const ORDER_STATUS = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
});

export const PAYMENT_METHODS = Object.freeze({
  STRIPE: 'stripe',
  MOCK: 'mock',
  CASH_ON_DELIVERY: 'cod'
});

/**
 * Valid transitions map to prevent invalid lifecycle jumps
 */
export const VALID_ORDER_TRANSITIONS = Object.freeze({
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PAID]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED],
  [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.REFUNDED],
  [ORDER_STATUS.CANCELLED]: [],
  [ORDER_STATUS.REFUNDED]: []
});

export const isValidOrderTransition = (currentStatus, nextStatus) => {
  const allowed = VALID_ORDER_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
};
