import { Cart } from '../models/cart.model.js';
import { Product } from '../models/product.model.js';
import { ApiError } from '../utils/ApiError.js';

export class CartService {
  /**
   * Get or create cart for user
   */
  static async getCart(userId) {
    let cart = await Cart.findOne({ user: userId }).populate('items.product', 'name price discountPrice images stock isActive');

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    return cart;
  }

  /**
   * Add item to cart
   */
  static async addToCart(userId, { productId, quantity = 1, selectedAttributes = {} }) {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      throw ApiError.notFound('Product is unavailable or does not exist.');
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Effective price (discountPrice if set > 0, else regular price)
    const effectivePrice = product.discountPrice > 0 ? product.discountPrice : product.price;

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString()
    );

    const targetQuantity = existingIndex > -1 ? cart.items[existingIndex].quantity + quantity : quantity;

    if (product.stock < targetQuantity) {
      throw ApiError.badRequest(
        `Cannot add ${quantity} item(s). Only ${product.stock} left in stock.`
      );
    }

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity = targetQuantity;
      cart.items[existingIndex].price = effectivePrice;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        price: effectivePrice,
        selectedAttributes
      });
    }

    cart.calculateTotals();
    await cart.save();

    return cart.populate('items.product', 'name price discountPrice images stock');
  }

  /**
   * Update quantity of an item in cart
   */
  static async updateCartItem(userId, itemId, quantity) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      throw ApiError.notFound('Cart not found.');
    }

    const item = cart.items.id(itemId);
    if (!item) {
      throw ApiError.notFound('Item not found in cart.');
    }

    const product = await Product.findById(item.product);
    if (!product || !product.isActive) {
      // Remove stale item
      cart.items.pull({ _id: itemId });
      cart.calculateTotals();
      await cart.save();
      throw ApiError.badRequest('Product is no longer available and was removed from cart.');
    }

    if (product.stock < quantity) {
      throw ApiError.badRequest(
        `Requested quantity (${quantity}) exceeds available stock (${product.stock}).`
      );
    }

    item.quantity = quantity;
    item.price = product.discountPrice > 0 ? product.discountPrice : product.price;

    cart.calculateTotals();
    await cart.save();

    return cart.populate('items.product', 'name price discountPrice images stock');
  }

  /**
   * Remove item from cart
   */
  static async removeCartItem(userId, itemId) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      throw ApiError.notFound('Cart not found.');
    }

    const item = cart.items.id(itemId);
    if (!item) {
      throw ApiError.notFound('Item not found in cart.');
    }

    cart.items.pull({ _id: itemId });
    cart.calculateTotals();
    await cart.save();

    return cart.populate('items.product', 'name price discountPrice images stock');
  }

  /**
   * Clear user's cart
   */
  static async clearCart(userId) {
    let cart = await Cart.findOne({ user: userId });
    if (cart) {
      cart.items = [];
      cart.calculateTotals();
      await cart.save();
    }
    return cart;
  }
}
