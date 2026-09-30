
# 🛒 Production E-Commerce Backend REST API

A modular, scalable, enterprise-grade E-Commerce backend built with **Node.js (ES Modules)**, **Express**, **MongoDB & Mongoose**, **JWT Authentication with Token Rotation**, and a **Modular Payment Engine** (Stripe + Mock Provider).

---

## ⚡ Key Highlights

- **Clean N-Tier Architecture**: Strict separation of concerns (Controllers $\rightarrow$ Services $\rightarrow$ Models / Repositories $\rightarrow$ Utilities).
- **Zero-Setup Local Dev**: Features an automatic in-memory MongoDB fallback. Run `npm start` immediately without installing MongoDB locally. When you're ready for MongoDB Atlas or a real instance, simply supply your connection string in `.env`.
- **Modular Payment Engine**:
  - `MockPaymentProvider`: Offline, zero-credential simulation of payment intents, confirmations, and webhooks for rapid local dev & automated testing.
  - `StripePaymentProvider`: Production-ready integration with Stripe PaymentIntents, webhook signature verification (`stripe-signature`), and refunds.
- **Enterprise Security**:
  - `helmet` security headers & Content Security Policy (CSP).
  - CORS with configurable whitelist.
  - Tiered Rate Limiting: Global API limiter + strict brute-force protection on Auth endpoints.
  - Parameter pollution protection with `hpp`.
  - Passwords hashed with `bcryptjs` (cost factor 12).
  - Refresh tokens and password reset tokens hashed with SHA-256 before database storage.
  - Automatic token rotation to detect token hijacking attempts.
- **Concurrency-Safe Stock Engine**: Uses atomic MongoDB updates (`{ _id, stock: { $gte: qty } }`, `$inc: { stock: -qty }`) to prevent race conditions or overselling under high concurrency.
- **Order State Machine**: Enforces valid lifecycle transitions (`pending` $\rightarrow$ `paid` $\rightarrow$ `processing` $\rightarrow$ `shipped` $\rightarrow$ `delivered`). Automatically restores inventory if orders are cancelled.
- **Observability & Logging**: Structured logging via **Winston** (console + rotating file logs) with unique `x-request-id` correlation IDs tracked across all HTTP requests.
- **Interactive Documentation**: Full OpenAPI 3.0 / Swagger UI live at `/api/v1/docs`.
- **Automated Testing Suite**: Integration tests covering Auth, Products, Cart, Orders, and Payments using **Vitest** and **Supertest**.
- **Docker Ready**: Production multi-stage `Dockerfile` and `docker-compose.yml` with MongoDB and Mongo-Express.

---

## 🏗️ Architecture & Project Structure

```
├── Dockerfile                   # Multi-stage production container
├── docker-compose.yml           # Backend + MongoDB + Mongo-Express stack
├── vitest.config.js             # Vitest test runner configuration
├── package.json
├── .env.example
└── src/
    ├── app.js                   # Express app configuration & middlewares
    ├── server.js                # Server entry point & graceful shutdown
    ├── config/
    │   ├── db.js                # MongoDB connection (with in-memory fallback)
    │   ├── env.js               # Environment variables validation with Joi
    │   ├── logger.js            # Winston structured logger
    │   └── swagger.js           # OpenAPI 3.0 specification
    ├── constants/
    │   ├── roles.js             # User roles (admin, customer, seller)
    │   ├── orderStatus.js       # Order states & state machine rules
    │   └── httpStatus.js        # Standard HTTP status codes
    ├── utils/
    │   ├── ApiError.js          # Custom operational error class
    │   ├── ApiResponse.js       # Standardized response wrapper
    │   ├── asyncHandler.js      # Async route handler wrapper
    │   ├── token.utils.js       # JWT & crypto hashing utilities
    │   └── queryFeatures.js     # Search, filter, sort, paginate helper
    ├── middlewares/
    │   ├── auth.middleware.js   # JWT authentication & RBAC authorization
    │   ├── validate.middleware.js # Joi schema request validator
    │   ├── error.middleware.js  # Centralized error handler
    │   ├── rateLimiter.middleware.js # Global & Auth rate limiters
    │   └── requestId.middleware.js # Request ID correlation tracing
    ├── models/
    │   ├── user.model.js        # User model with address book
    │   ├── category.model.js    # Hierarchical categories with slugs
    │   ├── product.model.js     # Products with SKUs, stock, attributes
    │   ├── cart.model.js        # Persistent shopping cart with tax/shipping
    │   ├── order.model.js       # Orders with line-item snapshot & state machine
    │   ├── review.model.js      # Verified buyer reviews & rating recalculation
    │   └── auditLog.model.js    # Audit trail for orders and payments
    ├── payments/
    │   ├── paymentProvider.interface.js # Abstract provider contract
    │   ├── mockPaymentProvider.js       # Offline dev/test provider
    │   ├── stripePaymentProvider.js     # Production Stripe SDK integration
    │   └── paymentFactory.js            # Dynamic provider resolver
    ├── validations/             # Joi request validation schemas
    ├── services/                # Decoupled business logic layer
    ├── controllers/             # Express request/response controllers
    ├── routes/                  # Modular versioned routes (/api/v1)
    ├── seeds/                   # Realistic database seed data
    └── tests/                   # Automated Vitest/Supertest test suite
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** $\ge 18.0.0$ (Tested on Node v22)
- **npm** $\ge 9.0.0$

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
The project comes with a ready-to-run `.env` file. You can also copy from `.env.example`:
```bash
cp .env.example .env
```

> **Note**: `MONGODB_URI=memory` will automatically spin up an in-memory database instance on startup. If you have MongoDB installed or a MongoDB Atlas URI, simply change `MONGODB_URI=mongodb://localhost:27017/ecommerce`.

### 4. Seed Database (Optional)
Populate realistic categories, products, verified reviews, and admin & customer accounts:
```bash
npm run seed
```

Default credentials seeded:
- **Admin**: `admin@example.com` / `AdminPassword123!`
- **Customer**: `customer@example.com` / `Customer123!`

### 5. Start the Application
- **Development Mode** (with auto-reload):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```

Access the application:
- **Swagger Documentation**: [http://localhost:5000/api/v1/docs](http://localhost:5000/api/v1/docs)
- **Health Check**: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

---

## 🧪 Running Automated Tests

Run the complete test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

---

## 🐳 Docker Deployment

Run the entire stack (API + MongoDB + Mongo-Express GUI) with Docker Compose:
```bash
docker compose up --build -d
```

- API: `http://localhost:5000`
- Mongo-Express UI: `http://localhost:8081` (Username: `admin`, Password: `pass`)

---

## 📖 API Documentation & Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| **Health** | | | |
| `GET` | `/api/v1/health` | Public | System status, uptime, memory, and DB state |
| **Auth** | | | |
| `POST` | `/api/v1/auth/register` | Public | Register customer account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & receive JWT tokens |
| `POST` | `/api/v1/auth/refresh-token` | Public | Exchange refresh token for fresh access token |
| `POST` | `/api/v1/auth/logout` | Authenticated | Revoke refresh token |
| `POST` | `/api/v1/auth/forgot-password`| Public | Generate secure password reset token |
| `POST` | `/api/v1/auth/reset-password` | Public | Set new password with valid token |
| **User & Profile** | | | |
| `GET` | `/api/v1/users/profile` | Authenticated | Get current user profile |
| `PATCH` | `/api/v1/users/profile` | Authenticated | Update profile details |
| `PATCH` | `/api/v1/users/change-password` | Authenticated | Update account password |
| `POST` | `/api/v1/users/addresses` | Authenticated | Add address to address book |
| `DELETE`| `/api/v1/users/addresses/:id` | Authenticated | Delete saved address |
| `GET` | `/api/v1/users` | Admin | List all registered users (paginated) |
| `PATCH` | `/api/v1/users/:id/status` | Admin | Update user active state or role |
| **Categories** | | | |
| `GET` | `/api/v1/categories` | Public | List all categories (hierarchical) |
| `GET` | `/api/v1/categories/:id` | Public | Get category by ID or slug |
| `POST` | `/api/v1/categories` | Admin | Create category |
| `PATCH` | `/api/v1/categories/:id` | Admin | Update category |
| `DELETE`| `/api/v1/categories/:id` | Admin | Delete category (checks product associations) |
| **Products** | | | |
| `GET` | `/api/v1/products` | Public | Filter, search, sort, and paginate catalog |
| `GET` | `/api/v1/products/:id` | Public | Get product details by ID or slug |
| `POST` | `/api/v1/products` | Admin/Seller | Create new product |
| `PATCH` | `/api/v1/products/:id` | Admin/Seller | Update product details |
| `DELETE`| `/api/v1/products/:id` | Admin | Delete product |
| **Cart** | | | |
| `GET` | `/api/v1/cart` | Authenticated | View persistent cart & auto-calculated totals |
| `POST` | `/api/v1/cart/items` | Authenticated | Add item to cart with stock validation |
| `PATCH` | `/api/v1/cart/items/:id` | Authenticated | Update item quantity |
| `DELETE`| `/api/v1/cart/items/:id` | Authenticated | Remove item from cart |
| `DELETE`| `/api/v1/cart/clear` | Authenticated | Clear all items from cart |
| **Orders** | | | |
| `POST` | `/api/v1/orders/checkout` | Authenticated | Checkout cart with atomic stock deduction |
| `GET` | `/api/v1/orders/my-orders` | Authenticated | List customer's order history |
| `GET` | `/api/v1/orders/:id` | Authenticated | Get order details |
| `POST` | `/api/v1/orders/:id/cancel` | Authenticated | Cancel order & restore inventory |
| `GET` | `/api/v1/orders` | Admin/Seller | List all orders with filters |
| `PATCH` | `/api/v1/orders/:id/status` | Admin/Seller | Transition order lifecycle status |
| **Payments** | | | |
| `POST` | `/api/v1/payments/intent` | Authenticated | Generate payment intent for order |
| `POST` | `/api/v1/payments/confirm/:id` | Authenticated | Confirm payment |
| `POST` | `/api/v1/payments/webhook/:provider` | Public | Webhook endpoint (Stripe / Mock) |
| `POST` | `/api/v1/payments/refund/:id` | Admin | Process payment refund |
| **Reviews** | | | |
| `GET` | `/api/v1/reviews/product/:id` | Public | Get product reviews & ratings |
| `POST` | `/api/v1/reviews/product/:id` | Authenticated | Submit verified buyer review |
| `DELETE`| `/api/v1/reviews/:id` | Authenticated/Admin | Delete review |
| **Analytics** | | | |
| `GET` | `/api/v1/analytics/dashboard`| Admin/Seller | Total revenue, orders, top sellers, low stock |

---

## 💳 Payment Gateway Configuration

### Using the Mock Provider (Default)
In `.env`:
```env
PAYMENT_PROVIDER=mock
```
- No API keys needed.
- Simulates realistic payment lifecycle, instant approvals, or failure simulation.
- Perfect for local development, demoing, and automated unit/integration tests.

### Switching to Stripe
In `.env`:
```env
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...
```
1. Add your real Stripe test keys.
2. In production or local webhook testing with Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:5000/api/v1/payments/webhook/stripe
   ```

---

## 🔒 Security Best Practices Implemented

1. **Anti-NoSQL Injection & Parameter Pollution**: Query sanitization and `hpp` parameter whitelisting.
2. **Timing Safe Comparison & Token Hashing**: Refresh tokens and password reset tokens are hashed using SHA-256 before storage to mitigate database leak vulnerabilities.
3. **Atomic Inventory Operations**: Eliminates race conditions where two simultaneous checkouts could buy the last remaining stock item.
4. **Graceful Shutdown**: Intercepts `SIGINT` / `SIGTERM` signals to cleanly drain active HTTP connections and close MongoDB connection pools without data corruption.
5. **Non-Root Docker Container**: Runs the application under the unprivileged `node` user in Docker.
>>>>>>> 263aa2b (E-comerce backend)
