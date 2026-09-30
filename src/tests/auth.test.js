import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Authentication API Endpoints', () => {
  const testUser = {
    name: 'Alice Tester',
    email: 'alice@test.com',
    password: 'SecurePassword123!',
    phone: '+1 555-1234'
  };

  it('should register a new user successfully and return tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.role).toBe('customer');
    expect(res.body.data.user.password).toBeUndefined(); // Password must never be leaked
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
  });

  it('should reject registration if email is already taken', async () => {
    // First registration
    await request(app).post('/api/v1/auth/register').send(testUser);

    // Duplicate registration
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should authenticate user and return tokens on valid login', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();
  });

  it('should reject login with incorrect password', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'wrong_password_123'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should refresh access token using valid refresh token', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send(testUser);
    const refreshToken = regRes.body.data.tokens.refreshToken;

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.tokens.accessToken).toBeDefined();
    expect(refreshRes.body.data.tokens.refreshToken).toBeDefined();
  });

  it('should allow authenticated user to view their profile', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send(testUser);
    const accessToken = regRes.body.data.tokens.accessToken;

    const profileRes = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.email).toBe(testUser.email);
  });
});
