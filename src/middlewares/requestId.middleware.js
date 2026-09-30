import crypto from 'crypto';

/**
 * Assigns or propagates an x-request-id header for correlation across logs
 */
export const requestIdMiddleware = (req, res, next) => {
  const incomingId = req.headers['x-request-id'];
  const requestId = (typeof incomingId === 'string' && incomingId) ? incomingId : crypto.randomUUID();
  req.id = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};
