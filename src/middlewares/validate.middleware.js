import { ApiError } from '../utils/ApiError.js';

/**
 * Higher-order middleware to validate req.body, req.query, or req.params against Joi schemas
 *
 * @param {object} schema - { body?: Joi.Schema, query?: Joi.Schema, params?: Joi.Schema }
 */
export const validate = (schema) => (req, res, next) => {
  const validationTargets = ['body', 'query', 'params'];

  for (const target of validationTargets) {
    if (schema[target]) {
      const { error, value } = schema[target].validate(req[target], {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errorDetails = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message.replace(/['"]/g, '')
        }));
        return next(ApiError.unprocessable('Validation Error', errorDetails));
      }

      // Reassign sanitized & typed values
      req[target] = value;
    }
  }

  next();
};
