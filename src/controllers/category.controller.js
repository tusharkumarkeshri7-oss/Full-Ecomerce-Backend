import { CategoryService } from '../services/category.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class CategoryController {
  static createCategory = asyncHandler(async (req, res) => {
    const category = await CategoryService.createCategory(req.body);
    res.status(HTTP_STATUS.CREATED).json(ApiResponse.created(category, 'Category created'));
  });

  static getAllCategories = asyncHandler(async (req, res) => {
    const categories = await CategoryService.getAllCategories();
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(categories, 'Categories retrieved'));
  });

  static getCategoryByIdOrSlug = asyncHandler(async (req, res) => {
    const category = await CategoryService.getCategoryByIdOrSlug(req.params.identifier);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(category, 'Category retrieved'));
  });

  static updateCategory = asyncHandler(async (req, res) => {
    const category = await CategoryService.updateCategory(req.params.id, req.body);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(category, 'Category updated'));
  });

  static deleteCategory = asyncHandler(async (req, res) => {
    await CategoryService.deleteCategory(req.params.id);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(null, 'Category deleted successfully'));
  });
}
