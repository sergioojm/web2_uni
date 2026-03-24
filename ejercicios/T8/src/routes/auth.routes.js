import { Router } from 'express';
import { registerCtrl, loginCtrl, getMeCtrl } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import authMiddleware from '../middleware/session.middleware.js';

const router = Router();

router.post('/register', validate(registerSchema), registerCtrl);
router.post('/login', validate(loginSchema), loginCtrl);
router.get('/me', authMiddleware, getMeCtrl);

export default router;
