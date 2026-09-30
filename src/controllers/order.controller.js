import { OrderService } from '../services/order.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class OrderController {
  static createOrder = asyncHandler(async (req, res) => {
    const order = await OrderService.createOrderFromCart(req.user._id, req.body);
    res.status(HTTP_STATUS.CREATED).json(ApiResponse.created(order, 'Order created successfully'));
  });

  static getOrderById = asyncHandler(async (req, res) => {
    const order = await OrderService.getOrderById(req.params.id, req.user);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(order, 'Order details retrieved'));
  });

  static getMyOrders = asyncHandler(async (req, res) => {
    const { orders, pagination } = await OrderService.getMyOrders(req.user._id, req.query);
    res
      .status(HTTP_STATUS.OK)
      .json(ApiResponse.success(orders, 'My orders retrieved', HTTP_STATUS.OK, pagination));
  });

  static getAllOrders = asyncHandler(async (req, res) => {
    const { orders, pagination } = await OrderService.getAllOrders(req.query);
    res
      .status(HTTP_STATUS.OK)
      .json(ApiResponse.success(orders, 'All orders retrieved', HTTP_STATUS.OK, pagination));
  });

  static updateOrderStatus = asyncHandler(async (req, res) => {
    const order = await OrderService.updateOrderStatus(req.params.id, req.body, req.user);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(order, 'Order status updated'));
  });

  static cancelOrder = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const order = await OrderService.cancelOrder(req.params.id, req.user, reason);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(order, 'Order cancelled successfully'));
  });
}
