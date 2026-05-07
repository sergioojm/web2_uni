import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';

jest.unstable_mockModule('../src/services/storage.service.js', () => ({
  uploadBuffer: jest.fn(async (_buf, opts) => ({
    url: `https://mock.cdn/${opts.folder}/${opts.filename}`
  }))
}));
jest.unstable_mockModule('../src/services/pdf.service.js', () => ({
  generateDeliveryNotePdf: jest.fn(async () => Buffer.from('PDFDATA'))
}));

const { default: app } = await import('../src/app.js');
const { registerAndOnboard } = await import('./helpers.js');

let tokenA;
let tokenB;
let clientA;
let projectA;
let noteA;

beforeAll(async () => {
  await mongoose.connect(process.env.DB_URI);

  ({ token: tokenA } = await registerAndOnboard(app, {
    cif: 'B10000001',
    companyName: 'Alpha SL'
  }));

  ({ token: tokenB } = await registerAndOnboard(app, {
    cif: 'B20000002',
    companyName: 'Beta SL'
  }));

  const cRes = await request(app)
    .post('/api/client')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ name: 'Cliente A', cif: 'B30000003' })
    .expect(201);
  clientA = cRes.body.data.client._id;

  const pRes = await request(app)
    .post('/api/project')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ name: 'Obra A', projectCode: 'A-001', client: clientA })
    .expect(201);
  projectA = pRes.body.data.project._id;

  const nRes = await request(app)
    .post('/api/deliverynote')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({
      format: 'hours',
      client: clientA,
      project: projectA,
      hours: 4,
      description: 'jornada A'
    })
    .expect(201);
  noteA = nRes.body.data.deliveryNote._id;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('Aislamiento multi-tenant — token de B no toca recursos de A', () => {
  describe('Client', () => {
    it('no ve cliente de A en GET por id', async () => {
      await request(app)
        .get(`/api/client/${clientA}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });

    it('no actualiza cliente de A', async () => {
      await request(app)
        .put(`/api/client/${clientA}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ phone: 'hijack' })
        .expect(404);
    });

    it('no borra cliente de A', async () => {
      await request(app)
        .delete(`/api/client/${clientA}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });

    it('no archiva cliente de A vía soft delete', async () => {
      await request(app)
        .delete(`/api/client/${clientA}?soft=true`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });

    it('no aparece cliente de A en su listado', async () => {
      const res = await request(app)
        .get('/api/client?name=Cliente A')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);
      expect(res.body.data.totalItems).toBe(0);
    });

    it('no restaura cliente de A', async () => {
      await request(app)
        .patch(`/api/client/${clientA}/restore`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });
  });

  describe('Project', () => {
    it('no ve proyecto de A', async () => {
      await request(app)
        .get(`/api/project/${projectA}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });

    it('no actualiza proyecto de A', async () => {
      await request(app)
        .put(`/api/project/${projectA}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'hijack' })
        .expect(404);
    });

    it('no borra proyecto de A', async () => {
      await request(app)
        .delete(`/api/project/${projectA}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });

    it('no aparece proyecto de A en listado de B', async () => {
      const res = await request(app)
        .get(`/api/project?client=${clientA}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);
      expect(res.body.data.totalItems).toBe(0);
    });
  });

  describe('DeliveryNote', () => {
    it('no ve albarán de A', async () => {
      await request(app)
        .get(`/api/deliverynote/${noteA}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });

    it('no descarga PDF de albarán de A', async () => {
      await request(app)
        .get(`/api/deliverynote/pdf/${noteA}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });

    it('no firma albarán de A', async () => {
      await request(app)
        .patch(`/api/deliverynote/${noteA}/sign`)
        .set('Authorization', `Bearer ${tokenB}`)
        .attach('signature', Buffer.from('img'), {
          filename: 's.png',
          contentType: 'image/png'
        })
        .expect(404);
    });

    it('no borra albarán de A', async () => {
      await request(app)
        .delete(`/api/deliverynote/${noteA}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });

    it('no aparece albarán de A en su listado', async () => {
      const res = await request(app)
        .get(`/api/deliverynote?client=${clientA}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);
      expect(res.body.data.totalItems).toBe(0);
    });

    it('B no puede crear albarán referenciando client/project de A', async () => {
      await request(app)
        .post('/api/deliverynote')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          format: 'hours',
          client: clientA,
          project: projectA,
          hours: 1
        })
        .expect(400);
    });
  });

  describe('Sanidad — A sí accede a sus propios recursos (descarta falso positivo)', () => {
    it('A ve su cliente', async () => {
      const res = await request(app)
        .get(`/api/client/${clientA}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      expect(res.body.data.client._id).toBe(clientA);
    });

    it('A ve su proyecto', async () => {
      const res = await request(app)
        .get(`/api/project/${projectA}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      expect(res.body.data.project._id).toBe(projectA);
    });

    it('A ve su albarán', async () => {
      const res = await request(app)
        .get(`/api/deliverynote/${noteA}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      expect(res.body.data.deliveryNote._id).toBe(noteA);
    });
  });
});
