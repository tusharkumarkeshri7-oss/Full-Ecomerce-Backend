import { Router } from 'express';
import { CartController } from '../controllers/cart.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  addToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema
} from '../validations/cart.validation.js';

const router = Router();

// All cart actions require authentication
router.use(authenticate);

router.get('/', CartController.getCart);
router.post('/items', validate(addToCartSchema), CartController.addToCart);
router.patch('/items/:itemId', validate(updateCartItemSchema), CartController.updateCartItem);
router.delete('/items/:itemId', validate(removeCartItemSchema), CartController.removeCartItem);
router.delete('/clear', CartController.clearCart);

export default router;
