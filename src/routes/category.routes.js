import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createCategorySchema, updateCategorySchema } from '../validations/category.validation.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Public routes
router.get('/', CategoryController.getAllCategories);
router.get('/:identifier', CategoryController.getCategoryByIdOrSlug);

// Admin-protected routes
router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(createCategorySchema),
  CategoryController.createCategory
);

router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(updateCategorySchema),
  CategoryController.updateCategory
);

router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  CategoryController.deleteCategory
);

export default router;
