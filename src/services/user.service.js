import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { QueryFeatures } from '../utils/queryFeatures.js';

export class UserService {
  /**
   * Get user profile by ID
   */
  static async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User profile not found.');
    }
    return user;
  }

  /**
   * Update profile details (name, phone)
   */
  static async updateProfile(userId, { name, phone }) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User profile not found.');
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();
    return user;
  }

  /**
   * Change current password
   */
  static async changePassword(userId, { currentPassword, newPassword }) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw ApiError.badRequest('Current password provided is incorrect.');
    }

    user.password = newPassword;
    user.refreshToken = undefined; // Invalidate refresh tokens
    await user.save();
    return { message: 'Password changed successfully.' };
  }

  /**
   * Add address to user address book
   */
  static async addAddress(userId, addressData) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    // If marked default or first address, unset others
    if (addressData.isDefault || user.addresses.length === 0) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
      addressData.isDefault = true;
    }

    user.addresses.push(addressData);
    await user.save();
    return user.addresses;
  }

  /**
   * Delete address from user's address book
   */
  static async deleteAddress(userId, addressId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      throw ApiError.notFound('Address not found in address book.');
    }

    user.addresses.pull({ _id: addressId });
    await user.save();
    return user.addresses;
  }

  /**
   * Set default shipping address
   */
  static async setDefaultAddress(userId, addressId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const target = user.addresses.id(addressId);
    if (!target) {
      throw ApiError.notFound('Address not found.');
    }

    user.addresses.forEach((addr) => {
      addr.isDefault = addr._id.toString() === addressId.toString();
    });

    await user.save();
    return user.addresses;
  }

  /**
   * Admin: List users with pagination and search
   */
  static async getAllUsers(queryString) {
    const features = new QueryFeatures(User.find(), queryString)
      .filter()
      .search(['name', 'email'])
      .sort('-createdAt')
      .limitFields();

    await features.paginate(User);
    const users = await features.mongooseQuery;

    return { users, pagination: features.paginationMeta };
  }

  /**
   * Admin: Update user status or role
   */
  static async updateUserStatus(userId, { isActive, role }) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    if (isActive !== undefined) user.isActive = isActive;
    if (role) user.role = role;

    await user.save();
    return user;
  }
}
