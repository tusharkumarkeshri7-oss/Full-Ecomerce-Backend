import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema
} from '../validations/order.validation.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate);

// Customer endpoints
router.post('/checkout', validate(createOrderSchema), OrderController.createOrder);
router.get('/my-orders', OrderController.getMyOrders);
router.get('/:id', OrderController.getOrderById);
router.post('/:id/cancel', validate(cancelOrderSchema), OrderController.cancelOrder);

// Admin / Staff endpoints
router.get('/', authorize(ROLES.ADMIN, ROLES.SELLER), OrderController.getAllOrders);
router.patch(
  '/:id/status',
  authorize(ROLES.ADMIN, ROLES.SELLER),
  validate(updateOrderStatusSchema),
  OrderController.updateOrderStatus
);

export default router;
