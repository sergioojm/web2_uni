import { Router } from 'express';
import * as ctrl from '../controllers/project.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireCompany } from '../middleware/requireCompany.js';
import { validate } from '../middleware/validate.js';
import {
  createProjectSchema,
  updateProjectSchema,
  idParamSchema
} from '../validators/project.validator.js';

const router = Router();

router.use(authMiddleware, requireCompany);

router.get('/archived', ctrl.listArchived);
router.patch('/:id/restore', validate(idParamSchema), ctrl.restore);

router.post('/', validate(createProjectSchema), ctrl.create);
router.put('/:id', validate(updateProjectSchema), ctrl.update);
router.get('/', ctrl.list);
router.get('/:id', validate(idParamSchema), ctrl.getOne);
router.delete('/:id', validate(idParamSchema), ctrl.remove);

export default router;
