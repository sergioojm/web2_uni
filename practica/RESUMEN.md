# Resumen — Practica Intermedia: BildyApp API

## Descripcion general

API REST para la gestion de usuarios de **BildyApp**, una aplicacion de gestion de albaranes. Esta practica intermedia implementa el modulo completo de **usuarios**: registro, verificacion de email, login, onboarding (datos personales y compania), subida de logo, gestion de sesion (refresh/logout), cambio de contrasena, invitacion de companeros y eliminacion (hard/soft delete).

Cubre los temas **T1 a T7** del curso Web Backend II.

---

## Stack tecnologico

| Categoria | Tecnologia | Tema |
|-----------|------------|------|
| Runtime | Node.js 22+ con ESM (`"type": "module"`) | T1 |
| Framework | Express 5 | T4 |
| Validacion | Zod (transform, refine, discriminatedUnion) | T4, T6 |
| Base de datos | MongoDB Atlas + Mongoose 8 | T5 |
| Autenticacion | JWT (access 15min + refresh 7d) + bcryptjs | T7 |
| Roles | Middleware `checkRole('admin')` | T7 |
| Seguridad | Helmet, express-rate-limit, express-mongo-sanitize | T6 |
| Subida de archivos | Multer (disco local, max 5MB) | T5 |
| Eventos | EventEmitter nativo de Node.js | T2 |
| Testing | Jest + Supertest + mongodb-memory-server | T8 |

---

## Arquitectura MVC

```
src/
├── config/
│   └── index.js                # Configuracion centralizada + conexion MongoDB
├── controllers/
│   └── user.controller.js      # Logica de negocio (10 endpoints + bonus)
├── middleware/
│   ├── auth.middleware.js       # Verificacion JWT → req.user
│   ├── error-handler.js        # notFound + errorHandler centralizado (4 params)
│   ├── role.middleware.js       # checkRole(...roles)
│   ├── upload.js                # Multer: storage disco, filtro imagen, limite 5MB
│   └── validate.js              # Wrapper generico Zod (body, query, params)
├── models/
│   ├── User.js                  # Schema con virtuals, indexes, select:false, toJSON transform
│   └── Company.js               # Schema con indexes (cif, owner)
├── routes/
│   └── user.routes.js           # Todas las rutas montadas en /api/user
├── services/
│   └── notification.service.js  # EventEmitter: user:registered/verified/invited/deleted
├── utils/
│   ├── AppError.js              # Clase con factorias: badRequest, unauthorized, conflict, tooMany...
│   ├── handleJwt.js             # signAccessToken, signRefreshToken, verify*
│   └── handlePassword.js        # encrypt, compare, generateVerificationCode
├── validators/
│   └── user.validator.js        # Schemas Zod para cada endpoint
├── app.js                       # Express: middleware de seguridad → rutas → error handler
└── index.js                     # Punto de entrada: dbConnect + listen
```

---

## Modelos de datos

### User

| Campo | Tipo | Notas |
|-------|------|-------|
| email | String | unique, lowercase, trim |
| password | String | select: false, cifrada con bcrypt |
| name, lastName | String | trim, default '' |
| nif | String | uppercase, trim |
| role | 'admin' \| 'guest' | default 'admin' |
| status | 'pending' \| 'verified' | default 'pending' |
| verificationCode | String | select: false, 6 digitos aleatorios |
| verificationAttempts | Number | default 3 |
| company | ObjectId → Company | default null |
| address | subdocumento | street, number, postal, city, province |
| refreshToken | String | select: false |
| deleted | Boolean | soft delete |

- **Virtual**: `fullName` → `name + ' ' + lastName`
- **Indexes**: email (unique), company, status, role
- **toJSON**: elimina password, verificationCode, refreshToken; incluye virtuals

### Company

| Campo | Tipo | Notas |
|-------|------|-------|
| owner | ObjectId → User | admin que la creo |
| name | String | required |
| cif | String | required, uppercase |
| address | subdocumento | misma estructura que User |
| logo | String | URL del logo subido |
| isFreelance | Boolean | true si es autonomo |
| deleted | Boolean | soft delete |

- **Indexes**: cif, owner

### Relacion

```
Company ←── owner ── User
Company ──── 1:N ──→ User (via user.company)
```

Un usuario crea una Company (se convierte en owner/admin). Otros usuarios que se unan a la misma Company (mismo CIF) reciben rol `guest`.

---

## Endpoints implementados

### 1. POST /api/user/register (1 pto)

- Valida email (Zod `.transform()` → lowercase) y password (min 8 chars)
- Rechaza 409 si el email ya esta verificado
- Cifra password con bcrypt, genera codigo de 6 digitos
- Crea usuario con role `admin`, status `pending`
- Devuelve `{ user, accessToken, refreshToken }` con status 201
- Emite evento `user:registered`

### 2. PUT /api/user/validation (1 pto)

- Requiere JWT
- Valida formato del codigo (regex 6 digitos)
- Si coincide: status → `verified`, emite `user:verified`
- Si no coincide: decrementa `verificationAttempts`
- Si intentos = 0: devuelve 429 Too Many Requests

### 3. POST /api/user/login (1 pto)

- Valida email y password con Zod
- Compara hash con bcrypt
- Si OK: devuelve usuario + tokens nuevos (rotacion de refresh)
- Si KO: 401 Unauthorized (sin revelar si es email o password)

### 4. PUT /api/user/register — Onboarding personal (1 pto)

- Requiere JWT
- Valida name, lastName, nif con Zod (trim, uppercase en NIF)
- Actualiza el usuario con `findByIdAndUpdate`

### 5. PATCH /api/user/company — Onboarding compania (1 pto)

- Requiere JWT
- Zod `discriminatedUnion('isFreelance', [...])`:
  - `isFreelance: true` → usa NIF del usuario como CIF, rellena datos automaticamente
  - `isFreelance: false` → valida name, cif, address
- Si el CIF no existe: crea Company nueva, usuario es owner (admin)
- Si el CIF ya existe: usuario se une como guest

### 6. PATCH /api/user/logo (1 pto)

- Requiere JWT + tener compania asociada
- Multer recibe imagen en campo `logo` (multipart/form-data)
- Filtro MIME (solo `image/*`), limite 5MB
- Guarda en `uploads/`, almacena URL en `Company.logo`

### 7. GET /api/user (1 pto)

- Requiere JWT
- Devuelve usuario con `populate('company')` (objeto completo, no solo ObjectId)
- Incluye virtual `fullName` en la respuesta JSON
- Filtra usuarios y companias borradas (`deleted: false`)

### 8. Gestion de sesion (1 pto)

**POST /api/user/refresh:**
- Recibe `refreshToken` en body
- Verifica con secret dedicado + compara con el almacenado en BD
- Devuelve nuevo accessToken + rota refreshToken

**POST /api/user/logout:**
- Requiere JWT
- Pone `refreshToken: null` en BD → invalida la sesion

### 9. DELETE /api/user (1 pto)

- Requiere JWT
- `?soft=true`: borrado logico (`deleted: true`)
- Sin query param: borrado fisico (`deleteOne`)
- Emite evento `user:deleted` con flag `soft`

### 10. POST /api/user/invite (1 pto)

- Requiere JWT + rol `admin`
- Crea usuario con role `guest`, misma company que el admin
- Genera password temporal si no se proporciona
- Rechaza 409 si el email ya existe
- Emite evento `user:invited`

### Bonus: PUT /api/user/password (+0.5 ptos)

- Requiere JWT
- Zod `.refine()`: nueva password != actual
- Verifica password actual con bcrypt antes de actualizar

### Bonus: discriminatedUnion (+0.5 ptos)

- Implementado en `onboardingCompanySchema` para validacion condicional segun `isFreelance`

---

## Requisitos tecnicos obligatorios

| Requisito | Estado | Implementacion |
|-----------|--------|----------------|
| ESM | OK | `"type": "module"` en package.json, `import`/`export` en todo el codigo |
| Node.js 22+ | OK | `engines: ">=22.0.0"`, scripts con `--watch` y `--env-file=.env` |
| async/await | OK | Todas las operaciones asincronas usan async/await |
| EventEmitter | OK | `NotificationService extends EventEmitter` con 4 eventos y listeners |
| MVC | OK | models/, controllers/, routes/, middleware/, validators/ |
| Zod | OK | Schemas con `.transform()`, `.refine()`, `discriminatedUnion` |
| MongoDB + Mongoose | OK | MongoDB Atlas, Mongoose 8 con timestamps y versionKey: false |
| populate | OK | GET /api/user popula company con filtro `deleted: false` |
| Virtuals | OK | `fullName` con `toJSON: { virtuals: true }` |
| Indexes | OK | User: email (unique), company, status, role; Company: cif, owner |
| AppError | OK | Clase con factorias + middleware centralizado de errores |
| Seguridad | OK | helmet(), cors(), rateLimit (200/15min), mongoSanitize |
| JWT + bcrypt | OK | Access 15min + refresh 7d, secrets separados, rotacion en refresh |
| Roles | OK | `checkRole('admin')` en middleware de rutas |

---

## Manejo de errores

### Clase AppError

```
AppError.badRequest(msg)    → 400
AppError.unauthorized(msg)  → 401
AppError.forbidden(msg)     → 403
AppError.notFound(msg)      → 404
AppError.conflict(msg)      → 409
AppError.tooMany(msg)       → 429
AppError.internal(msg)      → 500
```

### Middleware centralizado

El error handler (`error-handler.js`) captura:
- `AppError` (errores operacionales) → status + mensaje
- `mongoose.Error.ValidationError` → 400 con detalles por campo
- `mongoose.Error.CastError` → 400 (ID invalido)
- Codigo 11000 (duplicado MongoDB) → 409
- `JsonWebTokenError` / `TokenExpiredError` → 401
- `LIMIT_FILE_SIZE` (Multer) → 413
- Cualquier otro error → 500

Formato de respuesta de error:
```json
{ "error": true, "message": "...", "details": [...] }
```

---

## Tests

**44 tests** con Jest + Supertest + mongodb-memory-server (sin necesidad de MongoDB externo).

```bash
npm test              # ejecutar
npm run test:watch    # modo watch
npm run test:coverage # cobertura
```

### Cobertura por endpoint

| Endpoint | Tests | Casos cubiertos |
|----------|-------|-----------------|
| POST /register | 4 | registro OK, email invalido, password corta, email duplicado verificado |
| PUT /validation | 6 | sin token, formato invalido, codigo incorrecto (decrementa), 429 agotados, codigo correcto, ya verificado |
| POST /login | 4 | login OK, password incorrecto, usuario inexistente, body vacio |
| PUT /register (personal) | 3 | datos OK, sin token, datos incompletos |
| PATCH /company | 4 | nueva compania, guest por CIF existente, autonomo, sin token |
| PATCH /logo | 3 | logo OK, sin archivo, sin token |
| GET /user | 3 | populate + fullName, sin token, token invalido |
| POST /refresh | 3 | renovar OK, token invalido, body vacio |
| POST /logout | 2 | logout OK + refresh invalidado, sin token |
| PUT /password | 4 | cambiar OK + login con nueva, password actual incorrecta, nueva = actual (refine), sin token |
| POST /invite | 4 | admin invita guest, email duplicado, guest rechazado (403), sin token |
| DELETE /user | 3 | soft delete, hard delete, sin token |
| Ruta inexistente | 1 | 404 |

---

## Estructura de archivos

```
bildyapp-api/
├── src/                        # Codigo fuente
│   ├── app.js                  # Express: seguridad → rutas → errores
│   ├── index.js                # Entrada: dbConnect + listen
│   ├── config/index.js         # Variables de entorno centralizadas
│   ├── controllers/user.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error-handler.js
│   │   ├── role.middleware.js
│   │   ├── upload.js
│   │   └── validate.js
│   ├── models/
│   │   ├── User.js
│   │   └── Company.js
│   ├── routes/user.routes.js
│   ├── services/notification.service.js
│   ├── utils/
│   │   ├── AppError.js
│   │   ├── handleJwt.js
│   │   └── handlePassword.js
│   └── validators/user.validator.js
├── tests/                      # Tests
│   ├── user.test.js            # 44 tests
│   ├── global-setup.js         # MongoMemoryServer start
│   ├── global-teardown.js      # MongoMemoryServer stop
│   └── setup.js
├── uploads/                    # Logos subidos (gitignored)
├── api.http                    # Ejemplos REST Client
├── jest.config.js
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## Variables de entorno

```env
PORT=3000
NODE_ENV=development
DB_URI=mongodb+srv://user:pass@cluster.mongodb.net/bildyapp
JWT_SECRET=change-me-access-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change-me-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d
UPLOAD_MAX_SIZE=5242880
```

---

## Flujo tipico de uso

```
1. POST /api/user/register        → registro, obtener tokens
2. PUT /api/user/validation        → verificar email con codigo de 6 digitos
3. PUT /api/user/register          → completar nombre, apellidos, NIF
4. PATCH /api/user/company         → crear/unirse a compania
5. PATCH /api/user/logo            → subir logo de la compania
6. GET /api/user                   → ver perfil completo con compania populada
7. POST /api/user/refresh          → renovar access token cuando expire
8. POST /api/user/logout           → cerrar sesion
```
