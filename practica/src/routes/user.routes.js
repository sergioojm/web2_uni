import { Router } from 'express';
import * as ctrl from '../controllers/user.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { checkRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.js';
import { uploadLogo } from '../middleware/upload.js';
import {
  registerSchema,
  loginSchema,
  validationSchema,
  onboardingPersonalSchema,
  onboardingCompanySchema,
  refreshSchema,
  changePasswordSchema,
  inviteSchema,
  deleteQuerySchema
} from '../validators/user.validator.js';

const router = Router();

router.post('/register', validate(registerSchema), ctrl.register);
router.post('/login', validate(loginSchema), ctrl.login);
router.post('/refresh', validate(refreshSchema), ctrl.refresh);

router.put(
  '/validation',
  authMiddleware,
  validate(validationSchema),
  ctrl.validateEmail
);

router.put(
  '/register',
  authMiddleware,
  validate(onboardingPersonalSchema),
  ctrl.onboardingPersonal
);

router.patch(
  '/company',
  authMiddleware,
  validate(onboardingCompanySchema),
  ctrl.onboardingCompany
);

router.patch('/logo', authMiddleware, uploadLogo, ctrl.uploadCompanyLogo);

router.get('/', authMiddleware, ctrl.getMe);

router.post('/logout', authMiddleware, ctrl.logout);

router.delete(
  '/',
  authMiddleware,
  validate(deleteQuerySchema),
  ctrl.remove
);

router.put(
  '/password',
  authMiddleware,
  validate(changePasswordSchema),
  ctrl.changePassword
);

router.post(
  '/invite',
  authMiddleware,
  checkRole('admin'),
  validate(inviteSchema),
  ctrl.invite
);

export default router;
