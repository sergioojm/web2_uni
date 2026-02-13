// src/routes/cursos.routes.js
import { Router } from 'express';
import * as tareasController from '../controllers/tareas.controller.js';
import { validate } from '../middleware/validateRequest.js';
import { createTareaSchema, updateTareaSchema, filterTareaSchema } from '../schemas/tareas.schema.js';

const router = Router();

router.get('/', validate(filterTareaSchema), tareasController.getAll);
router.get('/:id', tareasController.getById);
router.post('/', validate(createTareaSchema), tareasController.create);
router.put('/:id', validate(updateTareaSchema), tareasController.update);
router.patch('/:id', validate(updateTareaSchema), tareasController.partialUpdate);
router.delete('/:id', tareasController.remove);

export default router;