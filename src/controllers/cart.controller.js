import { CartService } from '../services/cart.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class CartController {
  static getCart = asyncHandler(async (req, res) => {
    const cart = await CartService.getCart(req.user._id);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(cart, 'Cart retrieved'));
  });

  static addToCart = asyncHandler(async (req, res) => {
    const cart = await CartService.addToCart(req.user._id, req.body);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(cart, 'Item added to cart'));
  });

  static updateCartItem = asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const cart = await CartService.updateCartItem(req.user._id, itemId, quantity);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(cart, 'Cart item updated'));
  });

  static removeCartItem = asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const cart = await CartService.removeCartItem(req.user._id, itemId);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(cart, 'Item removed from cart'));
  });

  static clearCart = asyncHandler(async (req, res) => {
    const cart = await CartService.clearCart(req.user._id);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(cart, 'Cart cleared'));
  });
}
