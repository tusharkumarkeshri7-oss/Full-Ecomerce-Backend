import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

/**
 * 404 Route Not Found handler
 */
export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Global Centralized Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Transform non-ApiError into ApiError instances
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    let message = error.message || 'Internal Server Error';

    // Handle Mongoose Bad ObjectId (CastError)
    if (error.name === 'CastError') {
      message = `Invalid ${error.path}: ${error.value}`;
      error = ApiError.badRequest(message);
    }
    // Handle Mongoose Duplicate Key Error (11000)
    else if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || 'field';
      message = `Duplicate value entered for ${field}. Must be unique.`;
      error = ApiError.conflict(message);
    }
    // Handle Mongoose Validation Error
    else if (error.name === 'ValidationError') {
      const details = Object.values(error.errors || {}).map((val) => ({
        field: val.path,
        message: val.message
      }));
      error = ApiError.unprocessable('Validation Error', details);
    }
    // Handle JSON Web Token Errors
    else if (error.name === 'JsonWebTokenError') {
      error = ApiError.unauthorized('Invalid authentication token');
    } else if (error.name === 'TokenExpiredError') {
      error = ApiError.unauthorized('Authentication token has expired');
    } else {
      error = new ApiError(statusCode, message, [], err.stack);
      error.isOperational = false;
    }
  }

  // Log error using Winston with request ID
  const logPayload = {
    statusCode: error.statusCode,
    path: req.originalUrl,
    method: req.method,
    requestId: req.id,
    ip: req.ip
  };

  if (error.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - ${error.message}`, {
      ...logPayload,
      stack: error.stack
    });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} - ${error.message}`, logPayload);
  }

  // Response payload
  const responsePayload = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    ...(error.errors && error.errors.length > 0 && { errors: error.errors }),
    ...(!env.isProduction && { stack: error.stack })
  };

  res.status(error.statusCode).json(responsePayload);
};
