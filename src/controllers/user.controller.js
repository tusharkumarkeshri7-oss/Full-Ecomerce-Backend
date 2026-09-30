import { UserService } from '../services/user.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class UserController {
  static getProfile = asyncHandler(async (req, res) => {
    const user = await UserService.getProfile(req.user._id);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(user, 'User profile fetched'));
  });

  static updateProfile = asyncHandler(async (req, res) => {
    const user = await UserService.updateProfile(req.user._id, req.body);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(user, 'Profile updated successfully'));
  });

  static changePassword = asyncHandler(async (req, res) => {
    const result = await UserService.changePassword(req.user._id, req.body);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(null, result.message));
  });

  static addAddress = asyncHandler(async (req, res) => {
    const addresses = await UserService.addAddress(req.user._id, req.body);
    res.status(HTTP_STATUS.CREATED).json(ApiResponse.created(addresses, 'Address added'));
  });

  static deleteAddress = asyncHandler(async (req, res) => {
    const addresses = await UserService.deleteAddress(req.user._id, req.params.addressId);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(addresses, 'Address removed'));
  });

  static setDefaultAddress = asyncHandler(async (req, res) => {
    const addresses = await UserService.setDefaultAddress(req.user._id, req.params.addressId);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(addresses, 'Default address updated'));
  });

  // Admin endpoints
  static getAllUsers = asyncHandler(async (req, res) => {
    const { users, pagination } = await UserService.getAllUsers(req.query);
    res
      .status(HTTP_STATUS.OK)
      .json(ApiResponse.success(users, 'Users retrieved successfully', HTTP_STATUS.OK, pagination));
  });

  static updateUserStatus = asyncHandler(async (req, res) => {
    const user = await UserService.updateUserStatus(req.params.id, req.body);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(user, 'User status updated'));
  });
}
