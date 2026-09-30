import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/token.utils.js';
import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Authentication Middleware
 * Validates JWT access token and attaches authenticated user to req.user
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  let token = null;

  // 1. Extract token from Authorization header or cookie
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw ApiError.unauthorized('Authentication required. No token provided.');
  }

  // 2. Verify token
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token expired. Please refresh your session.');
    }
    throw ApiError.unauthorized('Invalid or malformed authentication token.');
  }

  // 3. Check if user still exists
  const user = await User.findById(decoded.id).select('+role +isActive +passwordChangedAt');
  if (!user) {
    throw ApiError.unauthorized('User associated with this token no longer exists.');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('User account is deactivated. Please contact support.');
  }

  // 4. Check if password changed after token was issued
  if (user.passwordChangedAfter && user.passwordChangedAfter(decoded.iat)) {
    throw ApiError.unauthorized('Password recently changed. Please log in again.');
  }

  // 5. Grant access
  req.user = user;
  next();
});

/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts access to specified roles
 *
 * @param  {...string} roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Role '${req.user.role}' is not authorized to access this resource.`
        )
      );
    }

    next();
  };
};
