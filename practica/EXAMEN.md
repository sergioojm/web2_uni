# EXAMEN — Reto F12

> Documentar y blindar la API con Swagger completo + test de contrato multi-tenant.

## Nota previa: numeración de líneas del enunciado

Las líneas que cita el enunciado están desplazadas respecto al código actual. He respondido sobre el código real y dejo aquí el mapeo para que se pueda ir directo:

| Enunciado | Realidad |
|---|---|
| `client.controller.js:5` `scope(req)` | línea **6** — `const scope = (req) => ({ company: req.user.company });` |
| `softDelete.js:14-17` hook pre-query | líneas **11-18** — función `excludeDeleted` |
| `socket.service.js:16` join room | línea **16** es la extracción del token; `socket.join('company:...')` está en la **línea 22** dentro de `if (user.company)` |
| `deliverynote.controller.js:87-95` sign + save | el método `sign` está en **111-152**; `note.save()` en **142**. Las líneas 87-95 corresponden a `downloadPdf` |
| `swagger.js:131` apis array | líneas **131-134** — `apis: ['./src/routes/*.js', './src/controllers/*.js']` |

---

## 1. softDelete.js — `find({ company: X, deleted: true })`

El hook (`src/utils/softDelete.js:11-18`) es:

```js
const excludeDeleted = function (next) {
  const filter = this.getFilter();
  const opts = this.getOptions();
  if (filter.deleted === undefined && !opts.withDeleted) {
    this.where({ deleted: false });
  }
  next();
};
```

La condición clave es `filter.deleted === undefined`. Al hacer `DeliveryNote.find({ company: X, deleted: true })`:

1. Mongoose dispara `pre('find', excludeDeleted)`.
2. `this.getFilter()` devuelve `{ company: X, deleted: true }`.
3. `filter.deleted === undefined` es **false** (vale `true`).
4. La condición compuesta es false → el hook **no** llama a `this.where({ deleted: false })`.
5. La query se ejecuta tal cual y devuelve documentos archivados.

**El plugin respeta el filtro explícito, no lo sobreescribe.** Esto es deliberado: la condición está pensada como "valor por defecto seguro" — si el llamador toma una decisión explícita sobre `deleted`, el plugin se aparta.

Hay una sutileza relacionada en el flujo `restore`. En `client.controller.js:113-125` y `project.controller.js:135-147` el filtro es `{ _id: req.params.id, ...scope(req) }` — sin `deleted`. Sin más, el hook inyectaría `{ deleted: false }` y nunca encontraríamos el doc archivado. La solución es la otra puerta de escape del hook: `opts.withDeleted`. Por eso ambos `restore` encadenan `.setOptions({ withDeleted: true })`. Dos formas de esquivar el filtro automático: o poner `deleted` explícito, o pasar `withDeleted: true`.

## 2. socket.service.js — usuario sin `company` en el handshake

El handshake completo (líneas 12-27) verifica el JWT y solo une al usuario a la room si tiene compañía:

```js
socket.data.user = user;
if (user.company) socket.join(`company:${user.company.toString()}`);
```

Si el usuario aún no se ha onboardeado (registro pero sin `PATCH /api/user/company`), `user.company` es `null` y el `if` no ejecuta el `join`. **El socket queda conectado pero sin pertenecer a ninguna `company:*` room.**

¿Qué eventos recibe? Solo los que se emitan a su socket directamente o a `io.emit(...)` global. Como toda la API emite vía `emitToCompany(...)` (línea 38) y eso siempre apunta a `company:${id}`, **el socket no recibe ningún evento de ninguna empresa**. No hay leak — pero tampoco utilidad.

¿Podría recibir eventos de otras empresas? Hoy no. Pero la garantía depende de una invariante implícita: "nunca se emite fuera de rooms `company:*`". Si en el futuro alguien añade un `io.emit('global:X', ...)` o un broadcast por otro criterio, este socket huérfano lo recibiría sin ninguna comprobación. Es un cabo suelto.

Cómo lo resolvería:

- **Opción mínima**: rechazar el handshake si no hay company (`return next(new Error('No onboarded'))`). Forzaría al cliente a reconectar tras el `PATCH /company` con un token nuevo. El socket nunca queda en estado "limbo".
- **Opción más rica**: meter al usuario en una room personal `user:${user._id}` y emitir a esa room los eventos de onboarding (p.ej. `user:companyJoined`). Cuando se onboardee, el cliente reconecta y entra en `company:${id}`. Mantiene el flujo de notificaciones durante el periodo sin empresa pero con reglas explícitas.

## 3. deliverynote.controller.js — `note.save()` en `sign` vs `findOneAndUpdate`

El `sign` actual (líneas 111-152) carga el documento populado, lo muta por pasos y llama a `note.save()` al final (línea 142). El resto del controller usa `findOneAndUpdate` (p.ej. `client.controller.js:31` para update). ¿Por qué la asimetría?

**Ventaja de `note.save()` aquí**:

- El método necesita el documento **populado** (`user`, `client`, `project`) para pasarlo a `generateDeliveryNotePdf(note)`. Con `findOneAndUpdate` tendría que volver a hacer una query con populate después.
- Las mutaciones son **dependientes en cadena**: subo la firma → asigno `signatureUrl` → genero el PDF (que depende de la firma ya asignada en el doc) → subo el PDF → asigno `pdfUrl`. `findOneAndUpdate` necesita todos los valores de antemano; aquí `pdfUrl` solo se conoce *después* de que `signatureUrl` esté en el doc y se haya generado el PDF.
- Single round-trip a Mongo al final, con todos los validadores del schema corriendo de una.
- El doc populado se reutiliza en el `emitToCompany` y en la respuesta.

**Riesgo en concurrencia (TOCTOU)**:

Si dos peticiones `PATCH /:id/sign` llegan a la vez sobre el mismo albarán:

1. Ambas pasan `findOne({ _id, ...scope(req) })` y obtienen `note.signed === false`.
2. Ambas pasan `if (note.signed) throw conflict`.
3. Ambas suben firma a Cloudinary → **dos firmas almacenadas, una orfana**.
4. Ambas generan y suben PDF → **dos PDFs**.
5. `note.save()` → la última escritura gana. La que pierda deja archivos en Cloudinary que nadie referencia.

Mongoose ofrece optimistic concurrency basada en `__v` solo si el schema tiene `versionKey` activo. Pero **`DeliveryNote.js:36` tiene `versionKey: false`** → no hay protección automática.

Mitigaciones:

- Activar `optimisticConcurrency: true` en `deliveryNoteSchema` (junto con un `versionKey`). Mongoose añadiría una condición `__v` en el `WHERE` del `save()` y rechazaría la escritura conflictiva.
- O bien usar `findOneAndUpdate({ _id, ...scope, signed: false }, { ... })` como guarda atómica al final, asumiendo el coste de re-query+populate para devolver el doc.
- O envolver en una transacción con replica set (`session.withTransaction`).
- A nivel infra: lock distribuido (Redis) por `sign:${noteId}` antes de iniciar el flujo.

Si tuviera que elegir uno, optimistic concurrency. Es el cambio mínimo y resuelve la condición de carrera contra el mismo documento.

## 4. Rendimiento con 50 usuarios y 500 albaranes — payload populado en sockets

El `emitToCompany(req.user.company, 'deliverynote:new', { deliveryNote: note })` con `note` populado lleva user + client + project anidados. En JSON serializado son varios KB por evento.

Problemas que aparecen al escalar:

- **Amplificación de bytes**: Socket.IO serializa la payload una vez pero la escribe 50 veces, una por cada miembro de la room. 1 KB × 50 clientes × N eventos/seg → ancho de banda lineal con cada usuario nuevo.
- **Coste de CPU**: `JSON.stringify` del objeto populado en cada emit. Para 1 evento es trivial; para una ráfaga (creación masiva, firma en lote) compite con el event loop que también atiende HTTP.
- **Backpressure**: clientes lentos (móvil con red mala) no consumen la cola Socket.IO al ritmo del servidor. Socket.IO mantiene un buffer por socket. Bajo carga sostenida, ese buffer crece → memoria por proceso → posible OOM. La 50ª conexión lenta puede arrastrar al servidor.
- **Caché desperdiciada**: el cliente probablemente ya tiene el `client` y el `project` del albarán; volverle a mandar el populado completo es bytes tirados.

Mitigaciones, de menos a más invasiva:

1. **Adelgazar la payload**: emitir `{ _id, project, client, signed, signedAt }`. Si el cliente necesita detalle, hace `GET /api/deliverynote/:id`. Cambio local de una línea.
2. **Pattern de "patch event"**: solo los campos que cambiaron (`{ _id, fields: { signed: true, signedAt } }`). Bytes mínimos.
3. **Throttle/debounce server-side**: si una operación masiva genera 100 eventos en 1s, agruparlos en un único `deliverynote:bulk` con un array de IDs.
4. **Volatile emit** para eventos no críticos (`io.to(room).volatile.emit(...)`): si el cliente no consume a tiempo, se descarta. Buena idea para *typing indicators*, mala para "albarán firmado".
5. **Redis adapter** (`@socket.io/redis-adapter`) cuando se necesite escalar horizontalmente más allá de un proceso. No reduce los bytes pero permite repartir el coste entre nodos.
6. **`perMessageDeflate`** ya viene activo por defecto en Socket.IO; sigue siendo útil con payloads JSON grandes.

La medida con mejor relación coste/beneficio aquí es la 1: adelgazar la payload del emit. Si más adelante se quiere notificación rica, mandar IDs y dejar que el cliente decida si pinta el detalle.

## 5. Storage — por qué eliminé el multi-provider

El commit `b045703` ("removed goofy ah feature (changing storage provider)") eliminó 71 líneas de `storage.service.js` y 11 vars de `.env.example` que soportaban switch entre S3 y Cloudinary vía env. El servicio quedó con un único proveedor: Cloudinary.

Por qué lo quité:

- En dev y en prod solo se usa Cloudinary. Nadie había pedido S3.
- El switch era una **abstracción sin segundo consumidor real**. Cumplía el patrón `if provider === 's3' { ... } else { ... }`, que es la forma más débil de abstracción: no oculta nada, solo añade ramas.
- Cada nueva feature (subida de logo, firma, PDF) tenía que respetar la API del switch. Más sitios donde equivocarse, sin beneficio observable.
- Tests más complicados: había que mockear el provider activo, o hacer tests cruzados — para algo que no se ejecuta en producción.
- Sintomático: el test `PATCH /api/user/logo` en `tests/user.test.js` aún espera una URL `/\/uploads\//` (modo local-disk del antiguo switch) y desde `b045703` falla en `main`. Es la herencia de una abstracción que sobrevivió a su uso. Lo dejo señalado aquí porque es exactamente el coste tangible de no haberla quitado a tiempo.
- Bonus: `@aws-sdk/client-s3` sigue como dependencia en `package.json` después del commit. Es una dep huérfana que merece otro PR de limpieza.

Cuándo *sí* es correcto tener una abstracción de storage:

- **Hay un segundo proveedor en producción real** (p.ej. clientes enterprise con bucket propio por compliance, o failover regional).
- **Migración activa**: durante semanas escribes en A y B en paralelo para hacer cutover sin downtime. La abstracción es temporal y se retira al acabar.
- **Política variable por tenant**: distintos clientes con distintos SLAs (latencia, retención, coste). Aquí el provider elegido es parte del dominio, no infra.

Cuándo es over-engineering:

- "Por si en el futuro cambiamos de proveedor". El futuro hipotético es la justificación más barata para añadir complejidad. Refactorizar 3 sitios cuando llegue el día es más fácil que mantener la abstracción durante años.
- Antes de tener 2 proveedores reales en código. Extraer la abstracción del segundo caso es trivial; predecirla desde 1 es adivinar.
- Cuando el "provider" solo cambia configuración (URL base, credenciales) sin cambio de modelo. Eso lo resuelve un objeto de config, no una capa de abstracción.

Regla de oro: 3 ocurrencias de algo similar es la pista para abstraer; 1 con un "por si acaso" es over-engineering.

---

## Proceso

### Anotaciones Swagger (12+ endpoints documentados)

- `src/config/swagger.js:131-134` ya carga `./src/routes/*.js`. La elección era anotar en routes o en controllers; opté por **routes** porque están más cerca del contrato HTTP (verbo + path + middlewares de validación) y el lector que abre Swagger UI espera coincidencia 1:1 con la route.
- Reuso máximo de `components.schemas` definidos en `swagger.js` (Client, DeliveryNote, Project, Address, Error, Paginated) vía `$ref: '#/components/schemas/...'`. Solo añadí inline schemas para casos no triviales (la unión `material | hours` del POST de albarán, multipart del sign).
- Códigos documentados por endpoint: 200/201/400/401/404/409 cuando aplica, ejemplos reales en los `examples` del POST de Client (CIF B11111111, dirección Madrid) y del POST de DeliveryNote (variantes material y hours con workers).
- **Verificación**:
  - `npm run dev` y abrir `http://localhost:3000/api-docs` → se ven dos secciones (Client, DeliveryNote) con todos los endpoints expandibles.
  - Inspección programática del spec generado:

```
Total paths: 8
  /api/client/archived → get
  /api/client/{id}/restore → patch
  /api/client → post,get
  /api/client/{id} → put,get,delete
  /api/deliverynote → post,get
  /api/deliverynote/pdf/{id} → get
  /api/deliverynote/{id} → get,delete
  /api/deliverynote/{id}/sign → patch
```

  → 13 operaciones documentadas (7 Client + 6 DeliveryNote). Mínimo pedido: 6.

- No se tocó `swagger.js` (el cambio observable es el JSDoc en routes).

### Test multi-tenant (`tests/multitenant.test.js`)

- Patrón heredado de `tests/deliverynote.test.js`: mock de `storage.service` y `pdf.service` con `jest.unstable_mockModule` para que el `sign` cruzado no toque Cloudinary real (corta antes en el `findOne` con 404, pero por seguridad).
- Setup: dos llamadas a `registerAndOnboard(app, { cif, companyName })` con CIFs distintos → empresas distintas (la lógica de `user.controller.js:onboardingCompany` busca empresa por CIF; si no existe la crea). Token A y token B nunca comparten compañía.
- Como Company A: crear `clientA` → `projectA` → `noteA`.
- Cubre los 3 recursos × CRUD por id × intento cruzado:
  - Client: `GET/PUT/DELETE /:id`, soft delete, restore, list filtrado.
  - Project: `GET/PUT/DELETE /:id`, list.
  - DeliveryNote: `GET/PUT/DELETE /:id`, `GET /pdf/:id`, `PATCH /:id/sign`, list filtrado por client de A.
  - **Bonus**: B intenta `POST /api/deliverynote` referenciando `client` y `project` de A → 400 (los `findOne` con scope dentro del `create` rechazan refs ajenas).
- **Por qué 404 (no 403)**: el filtro `{_id, ...scope(req)}` simplemente no encuentra documento → `AppError.notFound`. Es deliberado — no leakeas que el recurso existe en otra compañía.
- **Sanidad**: 3 tests adicionales con `tokenA` accediendo a sus propios recursos → 200. Sin esto, los 404 podrían ser falsos positivos por bug de setup.
- **Verificación de que el test "rompe" sin scope**: probado manualmente quitando `...scope(req)` del `getOne` de `client.controller.js:79-82`. Resultado: `npm test -- tests/multitenant.test.js` falla con `expected 404 "Not Found", got 200 "OK"` en el test "no ve cliente de A en GET por id". Restaurado el código y los 19 tests vuelven a pasar.

### Resultado

```
$ npm test -- tests/multitenant.test.js
Test Suites: 1 passed, 1 total
Tests:       19 passed, 19 total
```

- El resto de la suite (`client/project/deliverynote/user`) pasa salvo un test preexistente en `user.test.js` (`PATCH /api/user/logo` espera URL `/uploads/`, recibe URL `https://res.cloudinary.com/...`) — este fallo ya está en `main` antes de mis cambios y es la consecuencia visible mencionada en la pregunta 5.

### Archivos modificados / creados

| Ruta | Acción |
|---|---|
| `src/routes/client.routes.js` | JSDoc `@openapi` para 7 operaciones (sin tocar lógica) |
| `src/routes/deliverynote.routes.js` | JSDoc `@openapi` para 6 operaciones (sin tocar lógica) |
| `tests/multitenant.test.js` | Nuevo — 19 tests de aislamiento |
| `EXAMEN.md` | Este archivo |
