import { AnalyticsService } from '../services/analytics.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class AnalyticsController {
  static getDashboard = asyncHandler(async (req, res) => {
    const metrics = await AnalyticsService.getDashboardMetrics();
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(metrics, 'Store analytics retrieved'));
  });
}
