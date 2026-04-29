import request from 'supertest';
import User from '../src/models/User.js';

let counter = 0;

export const registerAndOnboard = async (app, overrides = {}) => {
  counter += 1;
  const email = overrides.email || `user${Date.now()}-${counter}@example.com`;
  const password = 'Password123';

  const reg = await request(app)
    .post('/api/user/register')
    .send({ email, password });
  const token = reg.body.data.accessToken;

  await User.findOneAndUpdate({ email }, { status: 'verified' });

  await request(app)
    .put('/api/user/register')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Test', lastName: 'User', nif: `${counter}1234567Z` });

  const cif =
    overrides.cif || `B${String(10000000 + counter).padStart(8, '0')}`;
  const companyName = overrides.companyName || `Empresa ${counter}`;

  const companyRes = await request(app)
    .patch('/api/user/company')
    .set('Authorization', `Bearer ${token}`)
    .send({ isFreelance: false, name: companyName, cif });

  const login = await request(app)
    .post('/api/user/login')
    .send({ email, password });

  return {
    email,
    password,
    token: login.body.data.accessToken,
    company: companyRes.body.data.company
  };
};
