import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { Category } from '../models/category.model.js';
import { Product } from '../models/product.model.js';
import { ORDER_STATUS, PAYMENT_STATUS } from '../constants/orderStatus.js';

describe('Order & Payment Lifecycle API Endpoints', () => {
  let customerToken;
  let product;

  beforeEach(async () => {
    // 1. Create Customer
    const regRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Sam Buyer',
      email: 'sam@buyer.com',
      password: 'Password123!'
    });
    customerToken = regRes.body.data.tokens.accessToken;

    // 2. Create Category and Product with 5 in stock
    const category = await Category.create({ name: 'Accessories' });
    product = await Product.create({
      name: 'Leather Minimalist Wallet',
      description: 'RFID blocking wallet',
      price: 45.0,
      sku: 'WAL-001',
      category: category._id,
      stock: 5
    });

    // 3. Add 2 units to cart
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: product._id.toString(),
        quantity: 2
      });
  });

  it('should checkout successfully, deduct inventory, and create order in PENDING status', async () => {
    const res = await request(app)
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        shippingAddress: {
          fullName: 'Sam Buyer',
          phone: '+1 555-9876',
          street: '123 Market St',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94105',
          country: 'US'
        },
        paymentMethod: 'mock'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderStatus).toBe(ORDER_STATUS.PENDING);
    expect(res.body.data.orderNumber).toMatch(/^ORD-/);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].quantity).toBe(2);

    // Verify atomic inventory deduction (5 - 2 = 3)
    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.stock).toBe(3);

    // Verify user cart was cleared
    const cartRes = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(cartRes.body.data.items.length).toBe(0);
  });

  it('should create payment intent and confirm payment with Mock provider', async () => {
    // 1. Checkout
    const orderRes = await request(app)
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        shippingAddress: {
          fullName: 'Sam Buyer',
          phone: '+1 555-9876',
          street: '123 Market St',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94105',
          country: 'US'
        },
        paymentMethod: 'mock'
      });
    const orderId = orderRes.body.data._id;

    // 2. Create Payment Intent
    const intentRes = await request(app)
      .post('/api/v1/payments/intent')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId });

    expect(intentRes.status).toBe(200);
    expect(intentRes.body.data.clientSecret).toBeDefined();
    expect(intentRes.body.data.transactionId).toMatch(/^mock_pi_/);

    // 3. Confirm Payment
    const confirmRes = await request(app)
      .post(`/api/v1/payments/confirm/${orderId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({});

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.paymentStatus).toBe(PAYMENT_STATUS.COMPLETED);
    expect(confirmRes.body.data.orderStatus).toBe(ORDER_STATUS.PAID);
  });

  it('should cancel order and automatically restore inventory', async () => {
    // 1. Checkout
    const orderRes = await request(app)
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        shippingAddress: {
          fullName: 'Sam Buyer',
          phone: '+1 555-9876',
          street: '123 Market St',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94105',
          country: 'US'
        }
      });
    const orderId = orderRes.body.data._id;

    // Stock should be 3
    let currentProduct = await Product.findById(product._id);
    expect(currentProduct.stock).toBe(3);

    // 2. Customer cancels order
    const cancelRes = await request(app)
      .post(`/api/v1/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Changed my mind' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.orderStatus).toBe(ORDER_STATUS.CANCELLED);

    // 3. Verify stock was restored to 5!
    currentProduct = await Product.findById(product._id);
    expect(currentProduct.stock).toBe(5);
  });
});
