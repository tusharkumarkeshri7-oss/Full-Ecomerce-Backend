import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Production E-Commerce Backend REST API',
    version: '1.0.0',
    description: `
### High-Performance Modular E-Commerce API
Built with Express.js, MongoDB/Mongoose, JWT Authentication, and Modular Payment Engine.

#### Key Features:
- **Authentication**: JWT access tokens + rotating refresh tokens + password reset tokens
- **RBAC**: Customer, Admin, Seller role tiers
- **Product Catalog**: Multi-faceted filtering, full-text search, regex search, pagination, category hierarchy
- **Inventory Engine**: Concurrency-safe atomic inventory reservation and automatic restoration on cancellation
- **Shopping Cart**: Database-backed cart with dynamic tax and shipping calculation
- **Order Lifecycle**: Strict state machine transitions (Pending -> Paid -> Processing -> Shipped -> Delivered)
- **Modular Payments**: Pluggable architecture supporting Stripe and Mock provider for offline testing
- **Product Reviews**: Customer feedback with verified-purchaser validation and automated rating aggregates
- **Admin Dashboard**: Real-time sales metrics, revenue analytics, and low-stock alerts
    `,
    contact: {
      name: 'Backend Architecture Team',
      email: 'dev@ecommerce.local'
    }
  },
  servers: [
    {
      url: `http://localhost:${env.port}${env.apiPrefix}`,
      description: 'Local Development Server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token'
      }
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          statusCode: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' },
          meta: {
            type: 'object',
            properties: {
              totalDocs: { type: 'number', example: 45 },
              limit: { type: 'number', example: 10 },
              page: { type: 'number', example: 1 },
              totalPages: { type: 'number', example: 5 },
              hasNextPage: { type: 'boolean', example: true },
              hasPrevPage: { type: 'boolean', example: false }
            }
          }
        }
      },
      ApiError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          statusCode: { type: 'number', example: 400 },
          message: { type: 'string', example: 'Validation Error' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'email' },
                message: { type: 'string', example: 'Please provide a valid email address' }
              }
            }
          }
        }
      }
    }
  }
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js']
};

export const swaggerSpec = swaggerJsdoc(options);
