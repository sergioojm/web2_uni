# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a university web2 course repository (Node.js ≥22 required) containing multiple independent Express.js API projects, each in its own directory with its own `package.json`:

- **`MODELO_VC_MONGO/`** — Reference implementation with MongoDB/Mongoose, file uploads (Multer), and Zod validation. This is the canonical template.
- **`TEST_1/`** — In-memory data store API (no DB), uses Helmet + Zod, serves as exam practice.
- **`ejercicios/T4/`** — Exercise: in-memory REST API with Zod validation.
- **`ejercicios/T5/`** — Exercise project (check contents for specifics).
- **`ejercicios/T8/`** — Exercise: JWT auth + Swagger docs + Jest tests + Slack webhook + MongoDB.

Each project is entirely self-contained. Run all commands from inside the specific project directory.

## Commands (run from inside the project directory)

```bash
npm run dev      # Start with hot-reload (node --watch)
npm start        # Production start
npm test         # Run tests (node --test for most; Jest for T8)
```

For T8 specifically:
```bash
npm run test:coverage   # Jest with coverage report
npm run test:watch      # Jest in watch mode
```

## Common Architecture Pattern

All projects follow the same layered structure:

```
src/
  app.js              # Express setup: middleware, routes, error handlers
  index.js            # Server entry: DB connect + app.listen
  config/db.js        # Mongoose connection (reads DB_URI from env)
  routes/index.js     # Route aggregator
  routes/*.routes.js  # Resource-specific routes
  controllers/        # Business logic, calls models directly
  models/             # Mongoose schemas (MongoDB projects)
  schemas/            # Zod validation schemas
  middleware/
    validate.middleware.js   # validate(), validateBody(), validateObjectId()
    error.middleware.js      # notFound + errorHandler
  utils/handleError.js       # handleHttpError(res, message, status)
```

**MODELO_VC_MONGO** adds:
- `utils/handleStorage.js` — Multer config with diskStorage, MIME allowlist, 10MB/5-file limits
- `models/storage.model.js` — Stores uploaded file metadata
- Static files served at `/uploads` from `storage/` directory

### Route Auto-Loading (MODELO_VC_MONGO)

`routes/index.js` dynamically imports all `*.routes.js` files in the same directory and mounts each at `/api/<filename-without-suffix>`. No manual registration needed — add a new `foo.routes.js` file and it's automatically available at `/api/foo`.

### Validation Pattern

Zod schemas in `schemas/` validate `{ body, query, params }` together. The `validate(schema)` middleware from `validate.middleware.js` runs before controllers. `validateObjectId()` guards routes with MongoDB `_id` params.

### Error Handling

Controllers do **not** use try/catch — errors propagate to the global `errorHandler` in `error.middleware.js`, which handles Mongoose validation errors, CastError (bad ObjectId), duplicate key (11000), Multer limits, and ZodError automatically.

## Environment Setup

Copy `.env.example` to `.env` before running MongoDB projects:

```
PORT=3000
NODE_ENV=development
DB_URI=mongodb+srv://...
```

Non-MongoDB projects (`TEST_1`, `T4`) read env via `src/config/env.js`.

## Known Environment Note

DNS is manually overridden in some `app.js` files (`dns.setServers(["1.1.1.1", "8.8.8.8"])`) due to local WSL DNS configuration issues. Do not remove this.
