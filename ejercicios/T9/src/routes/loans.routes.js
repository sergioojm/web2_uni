import { Router } from 'express';
import {
  getMyLoans,
  getAllLoans,
  requestLoan,
  returnLoan,
} from '../controllers/loans.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { createLoanSchema, idParamSchema } from '../schemas/loans.schema.js';
import authMiddleware from '../middleware/session.middleware.js';
import checkRol from '../middleware/rol.middleware.js';

const router = Router();

router.get('/me', authMiddleware, getMyLoans);
router.get('/', authMiddleware, checkRol('ADMIN'), getAllLoans);
router.post('/', authMiddleware, validate(createLoanSchema), requestLoan);
router.patch('/:id/return', authMiddleware, validate(idParamSchema), returnLoan);

export default router;
