import crypto from 'crypto';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken
} from '../utils/token.utils.js';
import { ROLES } from '../constants/roles.js';

export class AuthService {
  /**
   * Register a new user
   */
  static async register({ name, email, password, phone, role }) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ApiError.conflict('An account with this email address already exists.');
    }

    // Default to CUSTOMER unless explicitly authorized
    const assignedRole = role && Object.values(ROLES).includes(role) ? role : ROLES.CUSTOMER;

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: assignedRole
    });

    const tokens = await this._generateAuthTokens(user);
    return { user, tokens };
  }

  /**
   * Log in user with email and password
   */
  static async login({ email, password }) {
    const user = await User.findOne({ email }).select('+password +isActive +refreshToken');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password credentials.');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated. Please contact support.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password credentials.');
    }

    const tokens = await this._generateAuthTokens(user);
    return { user, tokens };
  }

  /**
   * Rotate and refresh access token using valid refresh token
   */
  static async refreshToken(rawRefreshToken) {
    let decoded;
    try {
      decoded = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token.');
    }

    const user = await User.findById(decoded.id).select('+refreshToken +isActive');
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User not found or deactivated.');
    }

    // Compare hashed token with database
    const hashed = hashToken(rawRefreshToken);
    if (user.refreshToken !== hashed) {
      // Possible token reuse attack detected: clear user's refresh token
      user.refreshToken = undefined;
      await user.save({ validateBeforeSave: false });
      throw ApiError.unauthorized('Refresh token compromised. Please log in again.');
    }

    // Issue fresh pair of tokens (rotation)
    const tokens = await this._generateAuthTokens(user);
    return { user, tokens };
  }

  /**
   * Log out user and revoke active refresh token
   */
  static async logout(userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }

  /**
   * Initiate Forgot Password flow
   */
  static async forgotPassword(email) {
    const user = await User.findOne({ email });
    if (!user) {
      // Return success anyway to avoid user enumeration vulnerability
      return { message: 'If an account exists, a reset instructions token was generated.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save({ validateBeforeSave: false });

    // In a full production setup with SMTP, send via email. Here we return token for API consumption.
    return {
      message: 'Password reset token generated successfully.',
      resetToken // Useful for dev/testing & client integration
    };
  }

  /**
   * Reset Password using valid token
   */
  static async resetPassword({ token, password }) {
    const hashedToken = hashToken(token);
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+password +passwordResetToken +passwordResetExpires');

    if (!user) {
      throw ApiError.badRequest('Password reset token is invalid or has expired.');
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = undefined; // Force re-login on all devices
    await user.save();

    const tokens = await this._generateAuthTokens(user);
    return { user, tokens };
  }

  /**
   * Helper: Generate access and refresh tokens and save hashed refresh token
   */
  static async _generateAuthTokens(user) {
    const tokenPayload = {
      id: user._id.toString(),
      role: user.role,
      email: user.email
    };

    const accessToken = generateAccessToken(tokenPayload);
    const rawRefreshToken = generateRefreshToken(tokenPayload);

    // Save hashed refresh token for secure revocation / rotation
    user.refreshToken = hashToken(rawRefreshToken);
    await user.save({ validateBeforeSave: false });

    return {
      accessToken,
      refreshToken: rawRefreshToken
    };
  }
}
