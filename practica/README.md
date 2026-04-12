# BildyApp API — Práctica Intermedia

Backend REST con Node.js + Express 5 + MongoDB para la gestión de usuarios de **BildyApp**. Cubre los temas T1–T7 del curso Web Backend II.

## Stack

- Node.js 22+ con ESM
- Express 5
- MongoDB Atlas + Mongoose
- Zod (validación)
- JWT (access + refresh) + bcryptjs
- Helmet, express-rate-limit, express-mongo-sanitize
- Multer (subida de logo)
- EventEmitter (`user:registered`, `user:verified`, `user:invited`, `user:deleted`)

## Instalación

```bash
npm install
cp .env.example .env   # rellenar variables
npm run dev
```

Servidor en `http://localhost:3000`. Health check: `GET /health`.

## Tests

Tests con Jest + Supertest + mongodb-memory-server (no necesita MongoDB externo):

```bash
npm test              # ejecutar tests
npm run test:watch    # modo watch
npm run test:coverage # informe de cobertura
```

## Variables de entorno

Ver `.env.example`. Imprescindibles: `DB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`.

## Endpoints

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/api/user/register` | Registro | ❌ |
| PUT | `/api/user/validation` | Validar email (código 6 dígitos) | ✅ |
| POST | `/api/user/login` | Login | ❌ |
| PUT | `/api/user/register` | Onboarding — datos personales | ✅ |
| PATCH | `/api/user/company` | Onboarding — compañía | ✅ |
| PATCH | `/api/user/logo` | Subir logo compañía (multipart) | ✅ |
| GET | `/api/user` | Usuario autenticado (populate company) | ✅ |
| POST | `/api/user/refresh` | Renovar access token | ❌ |
| POST | `/api/user/logout` | Cerrar sesión | ✅ |
| DELETE | `/api/user?soft=true` | Eliminar (hard/soft) | ✅ |
| PUT | `/api/user/password` | Cambiar contraseña | ✅ |
| POST | `/api/user/invite` | Invitar compañero (solo admin) | ✅ |

Ejemplos listos para ejecutar en `api.http` (REST Client / Thunder Client).

## Estructura

```
src/
├── config/         # Config + conexión Mongo
├── controllers/    # Lógica de negocio
├── middleware/     # auth, role, validate, upload, error
├── models/         # User, Company (virtuals, indexes)
├── routes/         # user.routes.js
├── services/       # notification.service.js (EventEmitter)
├── utils/          # AppError, JWT, password
├── validators/     # Esquemas Zod (transform + refine + discriminatedUnion)
├── app.js
└── index.js
```

## Notas de diseño

- **Soft delete**: campo `deleted: Boolean`; filtrado en todas las queries relevantes.
- **AppError**: clase con factorías (`badRequest`, `unauthorized`, ...) y middleware centralizado.
- **JWT**: access token 15 min + refresh token 7 días persistido en el documento del usuario.
- **Virtual `fullName`** en `User` con `toJSON: { virtuals: true }`.
- **Zod `discriminatedUnion`** en el onboarding de compañía según `isFreelance`.
- **Zod `.refine()`** en el cambio de contraseña (nueva ≠ actual).
- **Eventos**: los listeners hacen log por consola; en la práctica final se enviarán a Slack.
