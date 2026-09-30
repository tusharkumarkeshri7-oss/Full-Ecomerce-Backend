import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Webhook endpoint (Public, invoked by Stripe/Mock provider)
router.post('/webhook/:provider', PaymentController.handleWebhook);
router.post('/webhook', PaymentController.handleWebhook);

// Protected customer payment routes
router.post('/intent', authenticate, PaymentController.createIntent);
router.post('/confirm/:orderId', authenticate, PaymentController.confirmPayment);

// Admin refund route
router.post('/refund/:orderId', authenticate, authorize(ROLES.ADMIN), PaymentController.refundOrder);

export default router;
