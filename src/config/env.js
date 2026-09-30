import dotenv from 'dotenv';
import Joi from 'joi';

// Load .env variables
dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5000),
  API_PREFIX: Joi.string().default('/api/v1'),
  APP_NAME: Joi.string().default('ECommerceBackendAPI'),
  MONGODB_URI: Joi.string().default('memory'),
  JWT_ACCESS_SECRET: Joi.string().min(16).default('development_jwt_access_secret_super_key_32'),
  JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(16).default('development_jwt_refresh_secret_super_key_32'),
  JWT_REFRESH_EXPIRY: Joi.string().default('7d'),
  CORS_ORIGIN: Joi.string().default('*'),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: Joi.number().default(100),
  PAYMENT_PROVIDER: Joi.string().valid('mock', 'stripe').default('mock'),
  STRIPE_SECRET_KEY: Joi.string().allow('').default(''),
  STRIPE_WEBHOOK_SECRET: Joi.string().allow('').default(''),
  PAYMENT_CURRENCY: Joi.string().default('usd'),
  ADMIN_NAME: Joi.string().default('Super Admin'),
  ADMIN_EMAIL: Joi.string().email().default('admin@example.com'),
  ADMIN_PASSWORD: Joi.string().min(6).default('AdminPassword123!')
}).unknown(true);

const { value: envVars, error } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

export const env = Object.freeze({
  nodeEnv: envVars.NODE_ENV,
  isProduction: envVars.NODE_ENV === 'production',
  isTest: envVars.NODE_ENV === 'test',
  isDevelopment: envVars.NODE_ENV === 'development',
  port: envVars.PORT,
  apiPrefix: envVars.API_PREFIX,
  appName: envVars.APP_NAME,
  mongodbUri: envVars.MONGODB_URI,
  jwt: {
    accessSecret: envVars.JWT_ACCESS_SECRET,
    accessExpiry: envVars.JWT_ACCESS_EXPIRY,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
    refreshExpiry: envVars.JWT_REFRESH_EXPIRY
  },
  cors: {
    origin: envVars.CORS_ORIGIN
  },
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    max: envVars.RATE_LIMIT_MAX
  },
  payment: {
    provider: envVars.PAYMENT_PROVIDER,
    stripeSecretKey: envVars.STRIPE_SECRET_KEY,
    stripeWebhookSecret: envVars.STRIPE_WEBHOOK_SECRET,
    currency: envVars.PAYMENT_CURRENCY
  },
  seedAdmin: {
    name: envVars.ADMIN_NAME,
    email: envVars.ADMIN_EMAIL,
    password: envVars.ADMIN_PASSWORD
  }
});
