import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createReviewSchema } from '../validations/review.validation.js';

const router = Router();

// Public: View product reviews
router.get('/product/:productId', ReviewController.getProductReviews);

// Customer: Add review for product
router.post('/product/:productId', authenticate, validate(createReviewSchema), ReviewController.createReview);

// Delete review (owner or admin)
router.delete('/:id', authenticate, ReviewController.deleteReview);

export default router;
