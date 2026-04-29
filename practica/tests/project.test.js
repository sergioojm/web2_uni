import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { registerAndOnboard } from './helpers.js';

let token;
let clientId;
let projectId;

beforeAll(async () => {
  await mongoose.connect(process.env.DB_URI);
  ({ token } = await registerAndOnboard(app));

  const c = await request(app)
    .post('/api/client')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'C1', cif: 'B33333333' });
  clientId = c.body.data.client._id;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('Project CRUD', () => {
  it('crea proyecto', async () => {
    const res = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Reforma 1',
        projectCode: 'P-001',
        client: clientId
      })
      .expect(201);
    projectId = res.body.data.project._id;
  });

  it('rechaza projectCode duplicado', async () => {
    await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Otro', projectCode: 'P-001', client: clientId })
      .expect(409);
  });

  it('rechaza cliente de otra compañía', async () => {
    const { token: token2 } = await registerAndOnboard(app);
    await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token2}`)
      .send({ name: 'X', projectCode: 'P-X', client: clientId })
      .expect(400);
  });

  it('lista con filtro por client', async () => {
    const res = await request(app)
      .get(`/api/project?client=${clientId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.data.totalItems).toBe(1);
  });

  it('actualiza, soft delete, archived, restore, hard delete', async () => {
    await request(app)
      .put(`/api/project/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ active: false })
      .expect(200);

    await request(app)
      .delete(`/api/project/${projectId}?soft=true`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const archived = await request(app)
      .get('/api/project/archived')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(archived.body.data.totalItems).toBe(1);

    await request(app)
      .patch(`/api/project/${projectId}/restore`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app)
      .delete(`/api/project/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
