import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Only admin / store managers can view dashboard analytics
router.use(authenticate, authorize(ROLES.ADMIN, ROLES.SELLER));

router.get('/dashboard', AnalyticsController.getDashboard);

export default router;
