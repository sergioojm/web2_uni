import { Router } from 'express';
import * as ctrl from '../controllers/deliverynote.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireCompany } from '../middleware/requireCompany.js';
import { validate } from '../middleware/validate.js';
import { uploadSignature } from '../middleware/upload.js';
import {
  createDeliveryNoteSchema,
  idParamSchema
} from '../validators/deliverynote.validator.js';

const router = Router();

router.use(authMiddleware, requireCompany);

/**
 * @openapi
 * /api/deliverynote:
 *   post:
 *     tags: [DeliveryNote]
 *     summary: Crea un albarán (formato "material" u "hours")
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required: [format, client, project, material, quantity]
 *                 properties:
 *                   format: { type: string, enum: [material] }
 *                   client: { type: string, example: "65f0a1b2c3d4e5f607080910" }
 *                   project: { type: string, example: "65f0a1b2c3d4e5f607080911" }
 *                   description: { type: string }
 *                   workDate: { type: string, format: date-time }
 *                   material: { type: string, example: "Cemento Portland" }
 *                   quantity: { type: number, example: 25 }
 *                   unit: { type: string, example: "saco" }
 *               - type: object
 *                 required: [format, client, project]
 *                 properties:
 *                   format: { type: string, enum: [hours] }
 *                   client: { type: string }
 *                   project: { type: string }
 *                   description: { type: string }
 *                   workDate: { type: string, format: date-time }
 *                   hours: { type: number, example: 8 }
 *                   workers:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         name: { type: string, example: "Pedro" }
 *                         hours: { type: number, example: 4 }
 *           examples:
 *             material:
 *               value:
 *                 format: material
 *                 client: "65f0a1b2c3d4e5f607080910"
 *                 project: "65f0a1b2c3d4e5f607080911"
 *                 material: "Cemento Portland"
 *                 quantity: 25
 *                 unit: "saco"
 *             horas:
 *               value:
 *                 format: hours
 *                 client: "65f0a1b2c3d4e5f607080910"
 *                 project: "65f0a1b2c3d4e5f607080911"
 *                 hours: 8
 *                 workers: [{ name: "Pedro", hours: 4 }, { name: "Ana", hours: 4 }]
 *     responses:
 *       201:
 *         description: Albarán creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Albarán creado" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     deliveryNote: { $ref: '#/components/schemas/DeliveryNote' }
 *       400:
 *         description: Cliente o proyecto no válido para la compañía, o body inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401: { description: No autenticado }
 */
router.post('/', validate(createDeliveryNoteSchema), ctrl.create);

/**
 * @openapi
 * /api/deliverynote:
 *   get:
 *     tags: [DeliveryNote]
 *     summary: Lista paginada de albaranes con filtros
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
 *         name: project
 *         schema: { type: string }
 *       - in: query
 *         name: client
 *         schema: { type: string }
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [material, hours] }
 *       - in: query
 *         name: signed
 *         schema: { type: string, enum: ["true", "false"] }
 *       - in: query
 *         name: from
 *         description: workDate >= from (ISO date)
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         description: workDate <= to (ISO date)
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: sort
 *         schema: { type: string, example: "-workDate" }
 *     responses:
 *       200:
 *         description: Página de albaranes (con client y project poblados parcialmente)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/Paginated' }
 *       401: { description: No autenticado }
 */
router.get('/', ctrl.list);

/**
 * @openapi
 * /api/deliverynote/pdf/{id}:
 *   get:
 *     tags: [DeliveryNote]
 *     summary: Descarga el PDF del albarán (genera al vuelo si no está firmado, redirige a Cloudinary si sí)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF generado al vuelo
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *       302:
 *         description: Redirige al PDF firmado en Cloudinary
 *       400: { description: ObjectId inválido }
 *       401: { description: No autenticado }
 *       404: { description: Albarán no encontrado en la compañía }
 */
router.get('/pdf/:id', validate(idParamSchema), ctrl.downloadPdf);

/**
 * @openapi
 * /api/deliverynote/{id}:
 *   get:
 *     tags: [DeliveryNote]
 *     summary: Obtiene un albarán por id (con user, client y project poblados)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Albarán encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     deliveryNote: { $ref: '#/components/schemas/DeliveryNote' }
 *       400: { description: ObjectId inválido }
 *       401: { description: No autenticado }
 *       404:
 *         description: Albarán no encontrado en la compañía del usuario
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/:id', validate(idParamSchema), ctrl.getOne);

/**
 * @openapi
 * /api/deliverynote/{id}/sign:
 *   patch:
 *     tags: [DeliveryNote]
 *     summary: Firma el albarán (sube imagen, genera PDF firmado y los almacena en Cloudinary)
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [signature]
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *                 description: Imagen de la firma (cualquier image/*)
 *     responses:
 *       200:
 *         description: Albarán firmado, con signatureUrl y pdfUrl actualizados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Albarán firmado" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     deliveryNote: { $ref: '#/components/schemas/DeliveryNote' }
 *       400:
 *         description: Falta el archivo o no es imagen
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401: { description: No autenticado }
 *       404: { description: Albarán no encontrado en la compañía }
 *       409:
 *         description: Albarán ya firmado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch(
  '/:id/sign',
  uploadSignature,
  validate(idParamSchema),
  ctrl.sign
);

/**
 * @openapi
 * /api/deliverynote/{id}:
 *   delete:
 *     tags: [DeliveryNote]
 *     summary: Elimina un albarán (no permite borrar si está firmado)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Albarán eliminado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Albarán eliminado" }
 *       400: { description: ObjectId inválido }
 *       401: { description: No autenticado }
 *       404: { description: Albarán no encontrado en la compañía }
 *       409:
 *         description: No se puede borrar un albarán firmado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete('/:id', validate(idParamSchema), ctrl.remove);

export default router;
