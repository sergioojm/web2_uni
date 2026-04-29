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

let token;
let clientId;
let projectId;
let noteId;

beforeAll(async () => {
  await mongoose.connect(process.env.DB_URI);
  ({ token } = await registerAndOnboard(app));

  const c = await request(app)
    .post('/api/client')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'CDN', cif: 'B44444444' });
  clientId = c.body.data.client._id;

  const p = await request(app)
    .post('/api/project')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Obra', projectCode: 'DN-001', client: clientId });
  projectId = p.body.data.project._id;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('DeliveryNote', () => {
  it('crea albarán de horas', async () => {
    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        format: 'hours',
        client: clientId,
        project: projectId,
        hours: 8,
        description: 'jornada'
      })
      .expect(201);
    noteId = res.body.data.deliveryNote._id;
  });

  it('crea albarán de material', async () => {
    await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        format: 'material',
        client: clientId,
        project: projectId,
        material: 'Cemento',
        quantity: 10,
        unit: 'sacos'
      })
      .expect(201);
  });

  it('rechaza material sin cantidad', async () => {
    await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        format: 'material',
        client: clientId,
        project: projectId,
        material: 'X'
      })
      .expect(400);
  });

  it('lista con filtros', async () => {
    const res = await request(app)
      .get(`/api/deliverynote?format=hours&project=${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.data.totalItems).toBe(1);
  });

  it('obtiene albarán populado', async () => {
    const res = await request(app)
      .get(`/api/deliverynote/${noteId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.data.deliveryNote.client).toHaveProperty('name');
  });

  it('descarga PDF (sin firmar, generado al vuelo)', async () => {
    const res = await request(app)
      .get(`/api/deliverynote/pdf/${noteId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.headers['content-type']).toMatch(/pdf/);
  });

  it('firma con multipart', async () => {
    const res = await request(app)
      .patch(`/api/deliverynote/${noteId}/sign`)
      .set('Authorization', `Bearer ${token}`)
      .attach('signature', Buffer.from('imgdata'), {
        filename: 's.png',
        contentType: 'image/png'
      })
      .expect(200);
    expect(res.body.data.deliveryNote.signed).toBe(true);
    expect(res.body.data.deliveryNote.signatureUrl).toMatch(/mock\.cdn/);
    expect(res.body.data.deliveryNote.pdfUrl).toMatch(/mock\.cdn/);
  });

  it('no permite borrar si está firmado', async () => {
    await request(app)
      .delete(`/api/deliverynote/${noteId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(409);
  });

  it('no permite firmar dos veces', async () => {
    await request(app)
      .patch(`/api/deliverynote/${noteId}/sign`)
      .set('Authorization', `Bearer ${token}`)
      .attach('signature', Buffer.from('img2'), {
        filename: 's2.png',
        contentType: 'image/png'
      })
      .expect(409);
  });
});
