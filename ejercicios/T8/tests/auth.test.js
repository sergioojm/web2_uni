import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';

describe('Auth Endpoints', () => {
  let token = '';

  const testUser = {
    name: 'Test User',
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123',
  };

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and return 201 with token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.role).toBe('user');
      expect(res.body.user).not.toHaveProperty('password');

      token = res.body.token;
    });

    it('should return 409 if email is duplicated', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);

      expect(res.body.error).toBe(true);
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid' })
        .expect(400);

      expect(res.body.error).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login and return 200 with token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      token = res.body.token;
    });

    it('should return 401 if password is incorrect', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'WrongPassword123' })
        .expect(401);
    });

    it('should return 404 if user does not exist', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'noexiste@example.com', password: 'TestPassword123' })
        .expect(404);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 200 with user data when token is valid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.email).toBe(testUser.email);
    });

    it('should return 401 without token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });
  });
});
