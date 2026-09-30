import { Product } from '../models/product.model.js';
import { Category } from '../models/category.model.js';
import { ApiError } from '../utils/ApiError.js';
import { QueryFeatures } from '../utils/queryFeatures.js';
import mongoose from 'mongoose';

export class ProductService {
  /**
   * Create a new product
   */
  static async createProduct(productData) {
    // Verify category exists
    const category = await Category.findById(productData.category);
    if (!category) {
      throw ApiError.notFound('Associated category not found.');
    }

    const existingSku = await Product.findOne({ sku: productData.sku.toUpperCase() });
    if (existingSku) {
      throw ApiError.conflict(`Product with SKU '${productData.sku}' already exists.`);
    }

    return Product.create({
      ...productData,
      sku: productData.sku.toUpperCase()
    });
  }

  /**
   * Query products with advanced filtering, full-text search, and pagination
   */
  static async getAllProducts(queryString) {
    const baseQuery = Product.find({ isActive: true });

    const features = new QueryFeatures(baseQuery, queryString)
      .filter()
      .search(['name', 'description', 'brand', 'tags'])
      .sort('-createdAt')
      .limitFields();

    await features.paginate(Product);
    const products = await features.mongooseQuery.populate('category', 'name slug');

    return {
      products,
      pagination: features.paginationMeta
    };
  }

  /**
   * Get single product by ID or slug
   */
  static async getProductByIdOrSlug(identifier) {
    let query;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      query = { _id: identifier };
    } else {
      query = { slug: identifier.toLowerCase() };
    }

    const product = await Product.findOne(query).populate('category', 'name slug');
    if (!product) {
      throw ApiError.notFound('Product not found.');
    }
    return product;
  }

  /**
   * Update product
   */
  static async updateProduct(id, updateData) {
    if (updateData.category) {
      const category = await Category.findById(updateData.category);
      if (!category) {
        throw ApiError.notFound('Associated category not found.');
      }
    }

    if (updateData.sku) {
      updateData.sku = updateData.sku.toUpperCase();
      const existingSku = await Product.findOne({
        sku: updateData.sku,
        _id: { $ne: id }
      });
      if (existingSku) {
        throw ApiError.conflict(`SKU '${updateData.sku}' is already in use by another product.`);
      }
    }

    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).populate('category', 'name slug');

    if (!product) {
      throw ApiError.notFound('Product not found.');
    }

    return product;
  }

  /**
   * Delete product (soft delete or remove)
   */
  static async deleteProduct(id) {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      throw ApiError.notFound('Product not found.');
    }
    return product;
  }

  /**
   * Atomically deduct stock for multiple items to prevent race conditions / overselling
   * @param {Array<{ product: string, quantity: number, name: string }>} items
   */
  static async atomicDeductStock(items) {
    const deducted = [];

    try {
      for (const item of items) {
        const productId = item.product._id ? item.product._id : item.product;
        // Atomic update ensures stock >= quantity
        const updated = await Product.findOneAndUpdate(
          { _id: productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true }
        );

        if (!updated) {
          throw ApiError.badRequest(
            `Insufficient stock for item: '${item.name || productId}'. Cannot fulfill requested quantity.`
          );
        }

        deducted.push({ productId, quantity: item.quantity });
      }
    } catch (error) {
      // Rollback any stock that was deducted in this batch
      for (const d of deducted) {
        await Product.findByIdAndUpdate(d.productId, { $inc: { stock: d.quantity } });
      }
      throw error;
    }
  }

  /**
   * Restore stock on order cancellation or failure
   */
  static async restoreStock(items) {
    for (const item of items) {
      const productId = item.product._id ? item.product._id : item.product;
      await Product.findByIdAndUpdate(productId, { $inc: { stock: item.quantity } });
    }
  }
}
