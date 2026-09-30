import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  updateProfileSchema,
  updatePasswordSchema,
  addAddressSchema
} from '../validations/auth.validation.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Protected Customer/User Routes
router.use(authenticate);

router.get('/profile', UserController.getProfile);
router.patch('/profile', validate(updateProfileSchema), UserController.updateProfile);
router.patch('/change-password', validate(updatePasswordSchema), UserController.changePassword);

router.post('/addresses', validate(addAddressSchema), UserController.addAddress);
router.delete('/addresses/:addressId', UserController.deleteAddress);
router.patch('/addresses/:addressId/default', UserController.setDefaultAddress);

// Admin-Only Routes
router.get('/', authorize(ROLES.ADMIN), UserController.getAllUsers);
router.patch('/:id/status', authorize(ROLES.ADMIN), UserController.updateUserStatus);

export default router;
