import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * Operational Application Error
 * Differentiates anticipated client/business errors from unexpected system bugs
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error description
   * @param {Array} errors - Optional detailed validation or sub-errors
   * @param {string} stack - Optional stack trace override
   */
  constructor(
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message = 'Something went wrong',
    errors = [],
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;
    this.isOperational = true;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(msg = 'Bad Request', errors = []) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, msg, errors);
  }

  static unauthorized(msg = 'Unauthorized access') {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, msg);
  }

  static forbidden(msg = 'Forbidden: Insufficient privileges') {
    return new ApiError(HTTP_STATUS.FORBIDDEN, msg);
  }

  static notFound(msg = 'Resource not found') {
    return new ApiError(HTTP_STATUS.NOT_FOUND, msg);
  }

  static conflict(msg = 'Resource conflict') {
    return new ApiError(HTTP_STATUS.CONFLICT, msg);
  }

  static unprocessable(msg = 'Validation Failed', errors = []) {
    return new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, msg, errors);
  }

  static internal(msg = 'Internal Server Error') {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, msg);
  }
}
