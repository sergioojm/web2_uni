import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { registerAndOnboard } from './helpers.js';

let token;
let createdId;

beforeAll(async () => {
  await mongoose.connect(process.env.DB_URI);
  ({ token } = await registerAndOnboard(app));
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('Client CRUD', () => {
  it('rechaza sin token', async () => {
    await request(app).get('/api/client').expect(401);
  });

  it('crea cliente', async () => {
    const res = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'García SL',
        cif: 'B11111111',
        email: 'g@example.com',
        phone: '600',
        address: { city: 'Madrid' }
      })
      .expect(201);
    expect(res.body.data.client.name).toBe('García SL');
    createdId = res.body.data.client._id;
  });

  it('rechaza CIF duplicado', async () => {
    await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Otro', cif: 'B11111111' })
      .expect(409);
  });

  it('lista con paginación', async () => {
    const res = await request(app)
      .get('/api/client?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.data).toHaveProperty('totalItems');
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });

  it('filtra por nombre', async () => {
    const res = await request(app)
      .get('/api/client?name=García')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.data.items.length).toBe(1);
  });

  it('obtiene cliente por id', async () => {
    const res = await request(app)
      .get(`/api/client/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.data.client._id).toBe(createdId);
  });

  it('actualiza cliente', async () => {
    const res = await request(app)
      .put(`/api/client/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '699999999' })
      .expect(200);
    expect(res.body.data.client.phone).toBe('699999999');
  });

  it('soft delete + listado archived + restore', async () => {
    await request(app)
      .delete(`/api/client/${createdId}?soft=true`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const list = await request(app)
      .get('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(list.body.data.items.find((c) => c._id === createdId)).toBeFalsy();

    const archived = await request(app)
      .get('/api/client/archived')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(
      archived.body.data.items.find((c) => c._id === createdId)
    ).toBeTruthy();

    await request(app)
      .patch(`/api/client/${createdId}/restore`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('hard delete', async () => {
    await request(app)
      .delete(`/api/client/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app)
      .get(`/api/client/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('scoping: usuario de otra compañía no ve los clientes', async () => {
    const { token: token2 } = await registerAndOnboard(app);
    await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Privado', cif: 'B22222222' })
      .expect(201);

    const res = await request(app)
      .get('/api/client?name=Privado')
      .set('Authorization', `Bearer ${token2}`)
      .expect(200);
    expect(res.body.data.totalItems).toBe(0);
  });
});
