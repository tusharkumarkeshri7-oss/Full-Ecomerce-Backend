/**
 * Wraps an async route handler or middleware to eliminate repetitive try-catch blocks
 * and pass any rejected Promise directly to Express next(error).
 *
 * @param {Function} requestHandler
 * @returns {import('express').RequestHandler}
 */
export const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};
