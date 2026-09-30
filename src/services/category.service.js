import { Category } from '../models/category.model.js';
import { Product } from '../models/product.model.js';
import { ApiError } from '../utils/ApiError.js';
import mongoose from 'mongoose';

export class CategoryService {
  /**
   * Create a new category
   */
  static async createCategory(categoryData) {
    const existing = await Category.findOne({ name: categoryData.name });
    if (existing) {
      throw ApiError.conflict(`Category '${categoryData.name}' already exists.`);
    }

    if (categoryData.parentCategory) {
      const parent = await Category.findById(categoryData.parentCategory);
      if (!parent) {
        throw ApiError.notFound('Specified parent category does not exist.');
      }
    }

    return Category.create(categoryData);
  }

  /**
   * Get all active categories with parent category populated
   */
  static async getAllCategories() {
    return Category.find({ isActive: true })
      .populate('parentCategory', 'name slug')
      .sort('name');
  }

  /**
   * Get single category by Mongo ID or URL slug
   */
  static async getCategoryByIdOrSlug(identifier) {
    let query;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      query = { _id: identifier };
    } else {
      query = { slug: identifier.toLowerCase() };
    }

    const category = await Category.findOne(query).populate('parentCategory', 'name slug');
    if (!category) {
      throw ApiError.notFound('Category not found.');
    }
    return category;
  }

  /**
   * Update category details
   */
  static async updateCategory(id, updateData) {
    const category = await Category.findById(id);
    if (!category) {
      throw ApiError.notFound('Category not found.');
    }

    if (updateData.parentCategory && updateData.parentCategory === id) {
      throw ApiError.badRequest('A category cannot be its own parent.');
    }

    Object.assign(category, updateData);
    await category.save();
    return category;
  }

  /**
   * Delete category (ensures no products are attached to it)
   */
  static async deleteCategory(id) {
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      throw ApiError.conflict(
        `Cannot delete category. ${productCount} products are currently associated with it.`
      );
    }

    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      throw ApiError.notFound('Category not found.');
    }
    return deleted;
  }
}
