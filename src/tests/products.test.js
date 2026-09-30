import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { User } from '../models/user.model.js';
import { Category } from '../models/category.model.js';
import { ROLES } from '../constants/roles.js';

describe('Products and Catalog API Endpoints', () => {
  let adminToken;
  let customerToken;
  let testCategory;

  beforeEach(async () => {
    // 1. Create Admin
    const adminRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Admin User',
      email: 'admin@shop.com',
      password: 'AdminPassword123!',
      role: ROLES.ADMIN
    });
    // Manually force admin role in DB since register defaults to customer
    await User.findByIdAndUpdate(adminRes.body.data.user._id, { role: ROLES.ADMIN });
    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@shop.com',
      password: 'AdminPassword123!'
    });
    adminToken = adminLogin.body.data.tokens.accessToken;

    // 2. Create Customer
    const custRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Customer Joe',
      email: 'joe@shop.com',
      password: 'Customer123!'
    });
    customerToken = custRes.body.data.tokens.accessToken;

    // 3. Create Category
    testCategory = await Category.create({
      name: 'Smartphones',
      description: 'Mobile tech'
    });
  });

  it('should allow admin to create a new product', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Super Phone X',
        description: 'Next-gen flagship smartphone with OLED display',
        price: 999.99,
        sku: 'SPX-001',
        category: testCategory._id.toString(),
        stock: 50,
        brand: 'TechCorp',
        tags: ['smartphone', 'tech']
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Super Phone X');
    expect(res.body.data.slug).toContain('super-phone-x');
    expect(res.body.data.stock).toBe(50);
  });

  it('should forbid customers from creating products (RBAC)', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        name: 'Hacked Product',
        description: 'Should fail',
        price: 10,
        sku: 'HACK-01',
        category: testCategory._id.toString(),
        stock: 1
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should query products with filtering and search', async () => {
    // Seed 2 products
    await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Wireless Bluetooth Mouse',
        description: 'Ergonomic silent mouse',
        price: 49.99,
        sku: 'MS-001',
        category: testCategory._id.toString(),
        stock: 20
      });

    await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Mechanical Keyboard RGB',
        description: 'Gaming clicky keyboard',
        price: 119.99,
        sku: 'KB-002',
        category: testCategory._id.toString(),
        stock: 15
      });

    // Search query for "Keyboard"
    const searchRes = await request(app).get('/api/v1/products?search=Keyboard');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBe(1);
    expect(searchRes.body.data[0].name).toContain('Keyboard');
    expect(searchRes.body.meta.totalDocs).toBe(1);
  });
});
