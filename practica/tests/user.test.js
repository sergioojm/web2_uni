import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';

beforeAll(async () => {
  await mongoose.connect(process.env.DB_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

// ─── Helpers ────────────────────────────────────────────────
const testUser = {
  email: 'test@example.com',
  password: 'Password123'
};

let accessToken = '';
let refreshToken = '';
let verificationCode = '';

// ─── 1) POST /api/user/register ─────────────────────────────
describe('POST /api/user/register', () => {
  it('debería registrar un nuevo usuario', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send(testUser)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.role).toBe('admin');
    expect(res.body.data.user.status).toBe('pending');
    expect(res.body.data.user).not.toHaveProperty('password');

    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;

    // Obtener el código de verificación de la BD
    const dbUser = await User.findOne({ email: testUser.email }).select(
      '+verificationCode'
    );
    verificationCode = dbUser.verificationCode;
  });

  it('debería rechazar email inválido', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ email: 'invalido', password: 'Password123' })
      .expect(400);

    expect(res.body.error).toBe(true);
  });

  it('debería rechazar contraseña corta (< 8 chars)', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ email: 'otro@example.com', password: '1234' })
      .expect(400);

    expect(res.body.error).toBe(true);
  });

  it('debería rechazar email duplicado verificado', async () => {
    // Primero verificamos el usuario
    await User.findOneAndUpdate(
      { email: testUser.email },
      { status: 'verified' }
    );

    const res = await request(app)
      .post('/api/user/register')
      .send(testUser)
      .expect(409);

    expect(res.body.error).toBe(true);

    // Revertir para que los tests de validación funcionen
    await User.findOneAndUpdate(
      { email: testUser.email },
      { status: 'pending', verificationCode, verificationAttempts: 3 }
    );
  });
});

// ─── 2) PUT /api/user/validation ─────────────────────────────
describe('PUT /api/user/validation', () => {
  it('debería rechazar sin token', async () => {
    await request(app)
      .put('/api/user/validation')
      .send({ code: '123456' })
      .expect(401);
  });

  it('debería rechazar código con formato inválido', async () => {
    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: 'abc' })
      .expect(400);

    expect(res.body.error).toBe(true);
  });

  it('debería rechazar código incorrecto y decrementar intentos', async () => {
    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: '000000' })
      .expect(400);

    expect(res.body.error).toBe(true);

    const dbUser = await User.findOne({ email: testUser.email });
    expect(dbUser.verificationAttempts).toBe(2);
  });

  it('debería devolver 429 cuando se agotan los intentos', async () => {
    // Crear usuario auxiliar para agotar sus intentos
    const auxRes = await request(app)
      .post('/api/user/register')
      .send({ email: 'agotado@example.com', password: 'Password123' });

    const auxToken = auxRes.body.data.accessToken;

    // 3 intentos incorrectos para agotar los intentos
    await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${auxToken}`)
      .send({ code: '000001' });

    await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${auxToken}`)
      .send({ code: '000002' });

    // El tercer intento fallido devuelve 429
    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${auxToken}`)
      .send({ code: '000003' })
      .expect(429);

    expect(res.body.error).toBe(true);

    // Intentar de nuevo también devuelve 429
    const res2 = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${auxToken}`)
      .send({ code: '000004' })
      .expect(429);

    expect(res2.body.error).toBe(true);
  });

  it('debería verificar el email con código correcto', async () => {
    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: verificationCode })
      .expect(200);

    expect(res.body.data.status).toBe('verified');

    const dbUser = await User.findOne({ email: testUser.email });
    expect(dbUser.status).toBe('verified');
  });

  it('debería responder que ya está verificado si se intenta de nuevo', async () => {
    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: '123456' })
      .expect(200);

    expect(res.body.message).toMatch(/ya verificado/i);
  });
});

// ─── 3) POST /api/user/login ─────────────────────────────────
describe('POST /api/user/login', () => {
  it('debería hacer login correctamente', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send(testUser)
      .expect(200);

    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user.email).toBe(testUser.email);

    // Actualizar tokens para tests posteriores
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('debería rechazar password incorrecto', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: testUser.email, password: 'WrongPassword1' })
      .expect(401);

    expect(res.body.error).toBe(true);
  });

  it('debería rechazar usuario inexistente', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'noexiste@example.com', password: 'Password123' })
      .expect(401);

    expect(res.body.error).toBe(true);
  });

  it('debería rechazar body vacío', async () => {
    await request(app)
      .post('/api/user/login')
      .send({})
      .expect(400);
  });
});

// ─── 4) PUT /api/user/register (onboarding personal) ────────
describe('PUT /api/user/register (onboarding personal)', () => {
  it('debería actualizar datos personales', async () => {
    const res = await request(app)
      .put('/api/user/register')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Juan', lastName: 'García', nif: '12345678A' })
      .expect(200);

    expect(res.body.data.user.name).toBe('Juan');
    expect(res.body.data.user.lastName).toBe('García');
    expect(res.body.data.user.nif).toBe('12345678A');
  });

  it('debería rechazar sin token', async () => {
    await request(app)
      .put('/api/user/register')
      .send({ name: 'Juan', lastName: 'García', nif: '12345678A' })
      .expect(401);
  });

  it('debería rechazar datos incompletos', async () => {
    const res = await request(app)
      .put('/api/user/register')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Juan' })
      .expect(400);

    expect(res.body.error).toBe(true);
  });
});

// ─── 5) PATCH /api/user/company ──────────────────────────────
describe('PATCH /api/user/company', () => {
  it('debería crear una nueva compañía', async () => {
    const res = await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        isFreelance: false,
        name: 'Mi Empresa SL',
        cif: 'B12345678',
        address: {
          street: 'Calle Mayor',
          number: '10',
          postal: '28001',
          city: 'Madrid',
          province: 'Madrid'
        }
      })
      .expect(200);

    expect(res.body.data.company.name).toBe('Mi Empresa SL');
    expect(res.body.data.company.cif).toBe('B12345678');
    expect(res.body.data.user.role).toBe('admin');
  });

  it('debería asignar como guest si la compañía ya existe (mismo CIF)', async () => {
    // Crear otro usuario
    const otherRes = await request(app)
      .post('/api/user/register')
      .send({ email: 'otro@example.com', password: 'Password123' });

    const otherToken = otherRes.body.data.accessToken;

    // Onboarding personal del otro usuario
    await request(app)
      .put('/api/user/register')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Pedro', lastName: 'López', nif: '87654321B' });

    // Unirse a la misma compañía (mismo CIF)
    const res = await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        isFreelance: false,
        name: 'Mi Empresa SL',
        cif: 'B12345678'
      })
      .expect(200);

    expect(res.body.data.user.role).toBe('guest');
  });

  it('debería crear compañía como autónomo', async () => {
    // Crear usuario autónomo
    const autoRes = await request(app)
      .post('/api/user/register')
      .send({ email: 'autonomo@example.com', password: 'Password123' });

    const autoToken = autoRes.body.data.accessToken;

    // Datos personales
    await request(app)
      .put('/api/user/register')
      .set('Authorization', `Bearer ${autoToken}`)
      .send({ name: 'Ana', lastName: 'Martín', nif: '11111111C' });

    // Compañía como autónomo
    const res = await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${autoToken}`)
      .send({ isFreelance: true })
      .expect(200);

    expect(res.body.data.company.isFreelance).toBe(true);
    expect(res.body.data.company.cif).toBe('11111111C');
  });

  it('debería rechazar sin token', async () => {
    await request(app)
      .patch('/api/user/company')
      .send({ isFreelance: true })
      .expect(401);
  });
});

// ─── 6) PATCH /api/user/logo ─────────────────────────────────
describe('PATCH /api/user/logo', () => {
  it('debería subir un logo para la compañía', async () => {
    const res = await request(app)
      .patch('/api/user/logo')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('logo', Buffer.from('fake-image-content'), {
        filename: 'logo.png',
        contentType: 'image/png'
      })
      .expect(200);

    expect(res.body.data.company.logo).toMatch(/\/uploads\//);
  });

  it('debería rechazar sin archivo', async () => {
    const res = await request(app)
      .patch('/api/user/logo')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);

    expect(res.body.error).toBe(true);
  });

  it('debería rechazar sin token', async () => {
    await request(app)
      .patch('/api/user/logo')
      .expect(401);
  });
});

// ─── 7) GET /api/user ────────────────────────────────────────
describe('GET /api/user', () => {
  it('debería obtener los datos del usuario con populate', async () => {
    const res = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.fullName).toBe('Juan García');
    // company debe estar populada (no solo el ObjectId)
    expect(res.body.data.user.company).toHaveProperty('name');
    expect(res.body.data.user.company.name).toBe('Mi Empresa SL');
  });

  it('debería rechazar sin token', async () => {
    await request(app)
      .get('/api/user')
      .expect(401);
  });

  it('debería rechazar con token inválido', async () => {
    await request(app)
      .get('/api/user')
      .set('Authorization', 'Bearer token_invalido')
      .expect(401);
  });
});

// ─── 8) POST /api/user/refresh ───────────────────────────────
describe('POST /api/user/refresh', () => {
  it('debería renovar tokens con refresh token válido', async () => {
    const res = await request(app)
      .post('/api/user/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');

    // Actualizar tokens
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('debería rechazar refresh token inválido', async () => {
    const res = await request(app)
      .post('/api/user/refresh')
      .send({ refreshToken: 'token_invalido' })
      .expect(401);

    expect(res.body.error).toBe(true);
  });

  it('debería rechazar body vacío', async () => {
    await request(app)
      .post('/api/user/refresh')
      .send({})
      .expect(400);
  });
});

// ─── 9) POST /api/user/logout ────────────────────────────────
describe('POST /api/user/logout', () => {
  it('debería cerrar sesión correctamente', async () => {
    const res = await request(app)
      .post('/api/user/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.message).toMatch(/sesión cerrada/i);

    // El refresh token antiguo ya no debería funcionar
    await request(app)
      .post('/api/user/refresh')
      .send({ refreshToken })
      .expect(401);
  });

  it('debería rechazar sin token', async () => {
    await request(app)
      .post('/api/user/logout')
      .expect(401);
  });

  // Re-login para los siguientes tests
  afterAll(async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send(testUser);
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });
});

// ─── 10) PUT /api/user/password ──────────────────────────────
describe('PUT /api/user/password', () => {
  it('debería cambiar la contraseña correctamente', async () => {
    const res = await request(app)
      .put('/api/user/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: 'Password123',
        newPassword: 'NewPassword456'
      })
      .expect(200);

    expect(res.body.message).toMatch(/contraseña actualizada/i);

    // Verificar que se puede hacer login con la nueva
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email: testUser.email, password: 'NewPassword456' })
      .expect(200);

    accessToken = loginRes.body.data.accessToken;
    refreshToken = loginRes.body.data.refreshToken;
  });

  it('debería rechazar si la contraseña actual es incorrecta', async () => {
    const res = await request(app)
      .put('/api/user/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: 'WrongPassword',
        newPassword: 'OtraPassword789'
      })
      .expect(401);

    expect(res.body.error).toBe(true);
  });

  it('debería rechazar si nueva = actual (Zod refine)', async () => {
    const res = await request(app)
      .put('/api/user/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: 'NewPassword456',
        newPassword: 'NewPassword456'
      })
      .expect(400);

    expect(res.body.error).toBe(true);
  });

  it('debería rechazar sin token', async () => {
    await request(app)
      .put('/api/user/password')
      .send({
        currentPassword: 'NewPassword456',
        newPassword: 'OtraPassword789'
      })
      .expect(401);
  });
});

// ─── 11) POST /api/user/invite ───────────────────────────────
describe('POST /api/user/invite', () => {
  it('debería invitar un compañero (admin)', async () => {
    const res = await request(app)
      .post('/api/user/invite')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        email: 'invitado@example.com',
        name: 'Invitado',
        lastName: 'Test',
        nif: '99999999Z'
      })
      .expect(201);

    expect(res.body.data.user.email).toBe('invitado@example.com');
    expect(res.body.data.user.role).toBe('guest');
    expect(res.body.data).toHaveProperty('tempPassword');
  });

  it('debería rechazar email duplicado al invitar', async () => {
    const res = await request(app)
      .post('/api/user/invite')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        email: 'invitado@example.com',
        name: 'Otro',
        lastName: 'Test',
        nif: '88888888Y'
      })
      .expect(409);

    expect(res.body.error).toBe(true);
  });

  it('debería rechazar si el usuario no es admin', async () => {
    // Login como el usuario guest (otro@example.com)
    // Primero verificar su email para poder hacer login
    await User.findOneAndUpdate(
      { email: 'otro@example.com' },
      { status: 'verified' }
    );

    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email: 'otro@example.com', password: 'Password123' });

    const guestToken = loginRes.body.data.accessToken;

    const res = await request(app)
      .post('/api/user/invite')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        email: 'otro_invitado@example.com',
        name: 'No',
        lastName: 'Debería',
        nif: '77777777X'
      })
      .expect(403);

    expect(res.body.error).toBe(true);
  });

  it('debería rechazar sin token', async () => {
    await request(app)
      .post('/api/user/invite')
      .send({
        email: 'sin_token@example.com',
        name: 'Sin',
        lastName: 'Token',
        nif: '66666666W'
      })
      .expect(401);
  });
});

// ─── 12) DELETE /api/user ────────────────────────────────────
describe('DELETE /api/user', () => {
  let deleteToken = '';

  beforeAll(async () => {
    // Crear un usuario para soft delete
    const res = await request(app)
      .post('/api/user/register')
      .send({ email: 'borrable@example.com', password: 'Password123' });
    deleteToken = res.body.data.accessToken;
  });

  it('debería hacer soft delete', async () => {
    const res = await request(app)
      .delete('/api/user?soft=true')
      .set('Authorization', `Bearer ${deleteToken}`)
      .expect(200);

    expect(res.body.message).toMatch(/soft-deleted/i);

    // Verificar que el campo deleted es true
    const dbUser = await User.findOne({ email: 'borrable@example.com' });
    expect(dbUser.deleted).toBe(true);
  });

  it('debería hacer hard delete', async () => {
    // Crear otro usuario para hard delete
    const regRes = await request(app)
      .post('/api/user/register')
      .send({ email: 'harddelete@example.com', password: 'Password123' });

    const hardToken = regRes.body.data.accessToken;

    const res = await request(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${hardToken}`)
      .expect(200);

    expect(res.body.message).toMatch(/eliminado/i);

    // Verificar que el usuario no existe en la BD
    const dbUser = await User.findOne({ email: 'harddelete@example.com' });
    expect(dbUser).toBeNull();
  });

  it('debería rechazar sin token', async () => {
    await request(app)
      .delete('/api/user')
      .expect(401);
  });
});

// ─── 13) Ruta no encontrada ──────────────────────────────────
describe('Ruta no encontrada', () => {
  it('debería devolver 404 para ruta inexistente', async () => {
    const res = await request(app)
      .get('/api/ruta/inexistente')
      .expect(404);

    expect(res.body.error).toBe(true);
  });
});
