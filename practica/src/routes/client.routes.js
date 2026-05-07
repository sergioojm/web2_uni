import { Router } from 'express';
import * as ctrl from '../controllers/client.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireCompany } from '../middleware/requireCompany.js';
import { validate } from '../middleware/validate.js';
import {
  createClientSchema,
  updateClientSchema,
  idParamSchema,
  listClientSchema
} from '../validators/client.validator.js';

const router = Router();

router.use(authMiddleware, requireCompany);

/**
 * @openapi
 * /api/client/archived:
 *   get:
 *     tags: [Client]
 *     summary: Lista clientes archivados (soft-deleted) de la compañía
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, example: "-updatedAt" }
 *     responses:
 *       200:
 *         description: Página de clientes archivados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/Paginated' }
 *       401:
 *         description: Sin token o token inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/archived', ctrl.listArchived);

/**
 * @openapi
 * /api/client/{id}/restore:
 *   patch:
 *     tags: [Client]
 *     summary: Restaura un cliente archivado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "65f0a1b2c3d4e5f607080910" }
 *     responses:
 *       200:
 *         description: Cliente restaurado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Cliente restaurado" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     client: { $ref: '#/components/schemas/Client' }
 *       400:
 *         description: ObjectId inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401: { description: No autenticado }
 *       404:
 *         description: Cliente no encontrado en la compañía del usuario
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch('/:id/restore', validate(idParamSchema), ctrl.restore);

/**
 * @openapi
 * /api/client:
 *   post:
 *     tags: [Client]
 *     summary: Crea un cliente para la compañía del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, cif]
 *             properties:
 *               name: { type: string, example: "García SL" }
 *               cif: { type: string, example: "B11111111" }
 *               email: { type: string, format: email, example: "contacto@garcia.com" }
 *               phone: { type: string, example: "600123456" }
 *               address: { $ref: '#/components/schemas/Address' }
 *           examples:
 *             completo:
 *               value:
 *                 name: "García SL"
 *                 cif: "B11111111"
 *                 email: "contacto@garcia.com"
 *                 phone: "600123456"
 *                 address: { street: "Gran Vía", number: "1", postal: "28013", city: "Madrid", province: "Madrid" }
 *     responses:
 *       201:
 *         description: Cliente creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Cliente creado" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     client: { $ref: '#/components/schemas/Client' }
 *       400:
 *         description: Datos inválidos (Zod)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401: { description: No autenticado }
 *       409:
 *         description: Ya existe un cliente con ese CIF en la compañía
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/', validate(createClientSchema), ctrl.create);

/**
 * @openapi
 * /api/client/{id}:
 *   put:
 *     tags: [Client]
 *     summary: Actualiza un cliente de la compañía
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               cif: { type: string }
 *               email: { type: string }
 *               phone: { type: string, example: "699999999" }
 *               address: { $ref: '#/components/schemas/Address' }
 *     responses:
 *       200:
 *         description: Cliente actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     client: { $ref: '#/components/schemas/Client' }
 *       400: { description: Validación fallida }
 *       401: { description: No autenticado }
 *       404: { description: Cliente no encontrado }
 */
router.put('/:id', validate(updateClientSchema), ctrl.update);

/**
 * @openapi
 * /api/client:
 *   get:
 *     tags: [Client]
 *     summary: Lista paginada de clientes activos de la compañía
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: name
 *         description: Filtro case-insensitive por nombre (regex)
 *         schema: { type: string, example: "García" }
 *       - in: query
 *         name: sort
 *         schema: { type: string, example: "-createdAt" }
 *     responses:
 *       200:
 *         description: Página de clientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/Paginated' }
 *       400: { description: Query inválida }
 *       401: { description: No autenticado }
 */
router.get('/', validate(listClientSchema), ctrl.list);

/**
 * @openapi
 * /api/client/{id}:
 *   get:
 *     tags: [Client]
 *     summary: Obtiene un cliente por id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     client: { $ref: '#/components/schemas/Client' }
 *       400: { description: ObjectId inválido }
 *       401: { description: No autenticado }
 *       404:
 *         description: Cliente no encontrado en la compañía del usuario
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/:id', validate(idParamSchema), ctrl.getOne);

/**
 * @openapi
 * /api/client/{id}:
 *   delete:
 *     tags: [Client]
 *     summary: Elimina un cliente (hard delete, o soft con ?soft=true)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: soft
 *         description: Si "true" hace soft-delete (deleted=true), si no borra físicamente
 *         schema: { type: string, enum: ["true", "false"], example: "true" }
 *     responses:
 *       200:
 *         description: Cliente eliminado o archivado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Cliente archivado" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     client: { $ref: '#/components/schemas/Client' }
 *       400: { description: ObjectId inválido }
 *       401: { description: No autenticado }
 *       404: { description: Cliente no encontrado }
 */
router.delete('/:id', validate(idParamSchema), ctrl.remove);

export default router;
