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

router.get('/archived', ctrl.listArchived);
router.patch('/:id/restore', validate(idParamSchema), ctrl.restore);

router.post('/', validate(createClientSchema), ctrl.create);
router.put('/:id', validate(updateClientSchema), ctrl.update);
router.get('/', validate(listClientSchema), ctrl.list);
router.get('/:id', validate(idParamSchema), ctrl.getOne);
router.delete('/:id', validate(idParamSchema), ctrl.remove);

export default router;
