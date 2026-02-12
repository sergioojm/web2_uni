// src/routes/cursos.routes.js
import { Router } from 'express';
import * as cursosController from '../controllers/cursos.controller.js';
import { validate } from '../middleware/validateRequest.js';
import { createCursoSchema, updateCursoSchema } from '../schemas/cursos.schema.js';

const router = Router();

router.get('/', cursosController.getAll);
router.get('/:id', cursosController.getById);
router.post('/', validate(createCursoSchema), cursosController.create);
router.put('/:id', validate(updateCursoSchema), cursosController.update);
router.patch('/:id', validate(updateCursoSchema), cursosController.partialUpdate);
router.delete('/:id', cursosController.remove);

export default router;