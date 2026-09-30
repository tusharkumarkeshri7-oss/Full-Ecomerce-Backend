import { PaymentService } from '../services/payment.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class PaymentController {
  static createIntent = asyncHandler(async (req, res) => {
    const { orderId } = req.body;
    const result = await PaymentService.createPaymentIntent(orderId, req.user);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(result, 'Payment intent created'));
  });

  static confirmPayment = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const result = await PaymentService.confirmPayment(orderId, req.body, req.user);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(result, 'Payment status updated'));
  });

  static handleWebhook = asyncHandler(async (req, res) => {
    const signature = req.headers['stripe-signature'] || req.headers['x-webhook-signature'];
    const provider = req.params.provider || 'mock';

    // req.rawBody or req.body
    const payload = req.rawBody || req.body;

    const result = await PaymentService.handleWebhook(payload, signature, provider);
    res.status(HTTP_STATUS.OK).json(result);
  });

  static refundOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const result = await PaymentService.refundOrder(orderId, req.body, req.user);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(result, 'Payment refunded successfully'));
  });
}
