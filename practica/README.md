# BildyApp API — Práctica Final

Backend REST con Node.js + Express 5 + MongoDB para la digitalización de albaranes (clientes, proyectos y partes de horas/material) de **BildyApp**. Cubre T1–T13 del curso Web Backend II.

## Stack

- Node.js 22+ con ESM
- Express 5 + Helmet + rate-limit + mongo-sanitize
- MongoDB + Mongoose (con pre-hooks de soft delete y plugin propio)
- Zod (validación con `discriminatedUnion`, `superRefine`, `transform`)
- JWT access + refresh + bcryptjs
- Swagger UI (`/api-docs`) con `swagger-jsdoc`
- Socket.IO con auth JWT y rooms por compañía
- Multer + Sharp + Cloudinary / Cloudflare R2 (S3) para firmas e imágenes
- pdfkit para generar PDFs de albaranes
- Nodemailer para email de verificación
- Slack Incoming Webhook para errores 5xx
- Jest + Supertest + mongodb-memory-server
- Docker multi-stage + docker-compose + GitHub Actions

## Instalación local

```bash
npm install
cp .env.example .env   # rellena las variables
npm run dev
```

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api-docs`
- Health: `GET /health` → `{ status, db, uptime, timestamp }`

## Docker

```bash
docker compose up --build
```

Levanta la API y un MongoDB. La app conecta a `mongodb://mongo:27017/bildyapp`.

## Tests

```bash
npm test              # 68 tests
npm run test:coverage # cobertura ≥ 70 %
```

Los tests usan `mongodb-memory-server` (sin MongoDB externo) y mockean `storage.service` y `pdf.service` para no escribir a la nube.

## Variables de entorno

Ver `.env.example`. Imprescindibles: `DB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`. Para subida a la nube, fija `STORAGE_PROVIDER` a `cloudinary` o `r2` y rellena las credenciales correspondientes; sin configurar, se usa `local` (carpeta `uploads/`).

## Endpoints

### Usuarios (`/api/user`)
Registro, validación, login, onboarding personal y de compañía, logo, refresh, logout, soft/hard delete, cambio de contraseña, invitación.

### Clientes (`/api/client`)
`POST /`, `PUT /:id`, `GET /` (paginación + filtros `name`, `sort`), `GET /:id`, `DELETE /:id?soft=true`, `GET /archived`, `PATCH /:id/restore`.

### Proyectos (`/api/project`)
Equivalente al de clientes + filtros `client`, `name`, `active`, `sort`.

### Albaranes (`/api/deliverynote`)
`POST /` (`format: 'material' | 'hours'`, validado con Zod `discriminatedUnion`), `GET /` (filtros `project`, `client`, `format`, `signed`, `from`, `to`), `GET /:id` (populate user/client/project), `GET /pdf/:id` (genera o redirige al PDF en la nube), `PATCH /:id/sign` (multipart `signature` → Sharp → Cloudinary/R2 → genera y sube PDF), `DELETE /:id` (sólo si no firmado).

Ejemplos listos para ejecutar en `api.http`.

## WebSockets

Conexión con `auth: { token }` (JWT). Rooms por compañía. Eventos:
- `client:new`, `project:new`
- `deliverynote:new`, `deliverynote:signed`

## Feedback aplicado de la práctica intermedia

- `verificationAttempts` en `User` ahora es `select: false`; sólo los flujos que lo necesitan lo seleccionan explícitamente con `+verificationAttempts`.
- Plugin `applySoftDeletePlugin` (`src/utils/softDelete.js`) añade pre-hooks a `find`, `findOne`, `findOneAndUpdate`, `findOneAndDelete`, `countDocuments`, `count` y `distinct` que filtran `{ deleted: false }` automáticamente. Para acceder a documentos archivados se usa `.setOptions({ withDeleted: true })`.
- Eliminados todos los `deleted: false` redundantes en controllers/middleware.

## Estructura

```
src/
├── config/        # config, swagger
├── controllers/   # user, client, project, deliverynote
├── middleware/    # auth, role, validate, upload, requireCompany, error-handler
├── models/        # User, Company, Client, Project, DeliveryNote
├── routes/
├── services/      # storage, pdf, mail, slack, socket, notification
├── utils/         # AppError, jwt, password, pagination, softDelete
├── validators/
├── app.js
└── index.js
tests/             # Jest + supertest
Dockerfile
docker-compose.yml
.github/workflows/test.yml
```

## Graceful shutdown

`SIGTERM` y `SIGINT` cierran HTTP server, Socket.IO y la conexión Mongoose antes de salir.
