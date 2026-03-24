import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/user.model.js';
import { encrypt } from '../src/utils/handlePassword.js';

describe('Podcasts Endpoints', () => {
  let userToken = '';
  let adminToken = '';
  let podcastId = '';

  beforeAll(async () => {
    // Create regular user
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Regular User',
        email: `user_${Date.now()}@example.com`,
        password: 'UserPassword123',
      });
    userToken = userRes.body.token;

    // Create admin user directly in DB
    const hashedPassword = await encrypt('AdminPassword123');
    const admin = await User.create({
      name: 'Admin User',
      email: `admin_${Date.now()}@example.com`,
      password: hashedPassword,
      role: 'admin',
    });

    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'AdminPassword123' });
    adminToken = adminRes.body.token;
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  describe('GET /api/podcasts', () => {
    it('should return 200 with array of published podcasts', async () => {
      const res = await request(app)
        .get('/api/podcasts')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/podcasts', () => {
    it('should create a podcast and return 201 with token', async () => {
      const res = await request(app)
        .post('/api/podcasts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Mi Podcast de Tech',
          description: 'Un podcast sobre tecnología y desarrollo de software',
          category: 'tech',
          duration: 3600,
        })
        .expect(201);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data.title).toBe('Mi Podcast de Tech');
      podcastId = res.body.data._id;
    });

    it('should return 401 without token', async () => {
      await request(app)
        .post('/api/podcasts')
        .send({
          title: 'Podcast sin auth',
          description: 'Este podcast no debería crearse sin autenticación',
        })
        .expect(401);
    });
  });

  describe('DELETE /api/podcasts/:id', () => {
    it('should return 403 for a regular user', async () => {
      await request(app)
        .delete(`/api/podcasts/${podcastId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return 200 for admin', async () => {
      const res = await request(app)
        .delete(`/api/podcasts/${podcastId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
    });
  });

  describe('GET /api/podcasts/admin/all', () => {
    it('should return 200 with all podcasts for admin', async () => {
      const res = await request(app)
        .get('/api/podcasts/admin/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
