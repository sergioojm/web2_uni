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

router.post('/', validate(createDeliveryNoteSchema), ctrl.create);
router.get('/', ctrl.list);
router.get('/pdf/:id', validate(idParamSchema), ctrl.downloadPdf);
router.get('/:id', validate(idParamSchema), ctrl.getOne);
router.patch(
  '/:id/sign',
  uploadSignature,
  validate(idParamSchema),
  ctrl.sign
);
router.delete('/:id', validate(idParamSchema), ctrl.remove);

export default router;
