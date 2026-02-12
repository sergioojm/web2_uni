// src/routes/cursos.routes.js
import { Router } from 'express';
import * as usuariosController from '../controllers/usuarios.controller.js';
import { validate } from '../middleware/validateRequest.js';
import { createUserSchema } from '../schemas/usuarios.schema.js';

const router = Router();


router.get('/', usuariosController.getAll);
router.get('/:id', usuariosController.getById);
router.post('/', validate(createUserSchema), usuariosController.create);


export default router;