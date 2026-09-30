import { Review } from '../models/review.model.js';
import { Product } from '../models/product.model.js';
import { Order } from '../models/order.model.js';
import { ApiError } from '../utils/ApiError.js';
import { QueryFeatures } from '../utils/queryFeatures.js';
import { ORDER_STATUS } from '../constants/orderStatus.js';

export class ReviewService {
  /**
   * Submit a review for a product
   */
  static async createReview(userId, productId, { rating, title, comment }) {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      throw ApiError.notFound('Product not found.');
    }

    const existing = await Review.findOne({ product: productId, user: userId });
    if (existing) {
      throw ApiError.conflict('You have already submitted a review for this product.');
    }

    // Verify if user is a verified purchaser
    const verifiedOrder = await Order.findOne({
      user: userId,
      'items.product': productId,
      orderStatus: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED] }
    });

    const isVerifiedPurchase = Boolean(verifiedOrder);

    const review = await Review.create({
      user: userId,
      product: productId,
      rating,
      title,
      comment,
      isVerifiedPurchase
    });

    return review;
  }

  /**
   * Get all reviews for a product with pagination
   */
  static async getProductReviews(productId, queryString) {
    const features = new QueryFeatures(Review.find({ product: productId }), queryString)
      .filter()
      .sort('-createdAt')
      .limitFields();

    await features.paginate(Review);
    const reviews = await features.mongooseQuery.populate('user', 'name');

    return {
      reviews,
      pagination: features.paginationMeta
    };
  }

  /**
   * Delete review by ID
   */
  static async deleteReview(reviewId, currentUser) {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw ApiError.notFound('Review not found.');
    }

    const isOwner = review.user.toString() === currentUser._id.toString();
    const isAdmin = currentUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden('You are not authorized to delete this review.');
    }

    await Review.findByIdAndDelete(reviewId);
    return { message: 'Review deleted successfully.' };
  }
}
