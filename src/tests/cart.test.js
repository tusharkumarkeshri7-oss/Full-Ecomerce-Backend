import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { Category } from '../models/category.model.js';
import { Product } from '../models/product.model.js';

describe('Cart API Endpoints', () => {
  let customerToken;
  let product;

  beforeEach(async () => {
    // 1. Create Customer
    const regRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Bob Shopper',
      email: 'bob@shop.com',
      password: 'Password123!'
    });
    customerToken = regRes.body.data.tokens.accessToken;

    // 2. Create Category and Product
    const category = await Category.create({ name: 'Gadgets' });
    product = await Product.create({
      name: 'Smart Fitness Band',
      description: 'Tracks heart rate and steps',
      price: 50.0,
      sku: 'BAND-001',
      category: category._id,
      stock: 10
    });
  });

  it('should add item to user cart and compute totals', async () => {
    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: product._id.toString(),
        quantity: 2
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].quantity).toBe(2);
    expect(res.body.data.subtotal).toBe(100); // 50 * 2 = 100
    expect(res.body.data.shippingFee).toBe(0); // Free shipping over 100
    expect(res.body.data.tax).toBe(8); // 8% of 100
    expect(res.body.data.totalPrice).toBe(108);
  });

  it('should reject adding more quantity than available stock', async () => {
    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: product._id.toString(),
        quantity: 999 // Only 10 available
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should clear cart successfully', async () => {
    // Add item first
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: product._id.toString(),
        quantity: 1
      });

    const res = await request(app)
      .delete('/api/v1/cart/clear')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(0);
    expect(res.body.data.totalPrice).toBe(0);
  });
});
