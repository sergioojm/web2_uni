import { Router } from 'express';
import { registerCtrl, loginCtrl, getMeCtrl } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateBody, registerSchema, loginSchema } from '../validators/auth.validator.js';

const router = Router();

router.post('/register', validateBody(registerSchema), registerCtrl);
router.post('/login', validateBody(loginSchema), loginCtrl);
router.get('/me', authMiddleware, getMeCtrl);

export default router;
