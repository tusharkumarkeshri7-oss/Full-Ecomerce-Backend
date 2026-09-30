import { ReviewService } from '../services/review.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class ReviewController {
  static createReview = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const review = await ReviewService.createReview(req.user._id, productId, req.body);
    res.status(HTTP_STATUS.CREATED).json(ApiResponse.created(review, 'Review posted successfully'));
  });

  static getProductReviews = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { reviews, pagination } = await ReviewService.getProductReviews(productId, req.query);
    res
      .status(HTTP_STATUS.OK)
      .json(ApiResponse.success(reviews, 'Product reviews retrieved', HTTP_STATUS.OK, pagination));
  });

  static deleteReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await ReviewService.deleteReview(id, req.user);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(null, result.message));
  });
}
