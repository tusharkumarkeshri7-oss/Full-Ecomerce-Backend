import { ProductService } from '../services/product.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class ProductController {
  static createProduct = asyncHandler(async (req, res) => {
    const product = await ProductService.createProduct(req.body);
    res.status(HTTP_STATUS.CREATED).json(ApiResponse.created(product, 'Product created successfully'));
  });

  static getAllProducts = asyncHandler(async (req, res) => {
    const { products, pagination } = await ProductService.getAllProducts(req.query);
    res
      .status(HTTP_STATUS.OK)
      .json(ApiResponse.success(products, 'Products retrieved successfully', HTTP_STATUS.OK, pagination));
  });

  static getProductByIdOrSlug = asyncHandler(async (req, res) => {
    const product = await ProductService.getProductByIdOrSlug(req.params.identifier);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(product, 'Product retrieved'));
  });

  static updateProduct = asyncHandler(async (req, res) => {
    const product = await ProductService.updateProduct(req.params.id, req.body);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(product, 'Product updated successfully'));
  });

  static deleteProduct = asyncHandler(async (req, res) => {
    await ProductService.deleteProduct(req.params.id);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(null, 'Product deleted successfully'));
  });
}
