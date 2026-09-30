import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env.js';
import { morganStream } from './config/logger.js';
import { swaggerSpec } from './config/swagger.js';
import { requestIdMiddleware } from './middlewares/requestId.middleware.js';
import { apiLimiter } from './middlewares/rateLimiter.middleware.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';
import apiRoutes from './routes/index.js';

const app = express();

// 1. Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false // Allows Swagger UI assets to load seamlessly
  })
);

// 2. CORS Configuration
app.use(
  cors({
    origin: env.cors.origin === '*' ? true : env.cors.origin.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id']
  })
);

// 3. Request Correlation ID
app.use(requestIdMiddleware);

// 4. HTTP Request Logging (Morgan -> Winston)
if (!env.isTest) {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms', { stream: morganStream }));
}

// 5. Raw Body Capture for Stripe/Payment Webhooks (must precede standard json parser)
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      if (req.originalUrl.includes('/webhook')) {
        req.rawBody = buf;
      }
    }
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 6. HTTP Parameter Pollution Prevention
app.use(hpp({ whitelist: ['price', 'ratingsAverage', 'category', 'brand', 'tags'] }));

// 7. Gzip/Brotli Compression
app.use(compression());

// 8. Global Rate Limiter
app.use(env.apiPrefix, apiLimiter);

// 9. API Documentation (Swagger UI)
app.use(`${env.apiPrefix}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'E-Commerce REST API Docs',
  customCss: '.swagger-ui .topbar { display: none }'
}));

// Redirect root to docs
app.get('/', (req, res) => {
  res.redirect(`${env.apiPrefix}/docs`);
});

// 10. Mount Resource Routes
app.use(env.apiPrefix, apiRoutes);

// 11. 404 Route Handler & Centralized Error Handler
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
