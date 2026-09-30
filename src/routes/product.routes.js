import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createProductSchema,
  updateProductSchema,
  queryProductSchema
} from '../validations/product.validation.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Public Catalog Routes
router.get('/', validate(queryProductSchema), ProductController.getAllProducts);
router.get('/:identifier', ProductController.getProductByIdOrSlug);

// Staff/Admin Product Management Routes
router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.SELLER),
  validate(createProductSchema),
  ProductController.createProduct
);

router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.SELLER),
  validate(updateProductSchema),
  ProductController.updateProduct
);

router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  ProductController.deleteProduct
);

export default router;
