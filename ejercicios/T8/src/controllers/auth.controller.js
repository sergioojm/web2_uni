import User from '../models/user.model.js';
import { encrypt, compare } from '../utils/handlePassword.js';
import { tokenSign } from '../utils/handleJwt.js';
import { asyncHandler, errors } from '../utils/handleError.js';
import { sendSlackNotification } from '../utils/handleLogger.js';

// POST /api/auth/register
export const registerCtrl = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw errors.conflict('EMAIL_ALREADY_EXISTS');

  const password = await encrypt(req.body.password);
  const user = await User.create({ ...req.body, password });

  if (user.role === 'admin') {
    await sendSlackNotification(`🔑 Nuevo admin registrado: ${user.email}`);
  }

  user.set('password', undefined, { strict: false });

  res.status(201).json({
    token: tokenSign(user),
    user,
  });
});

// POST /api/auth/login
export const loginCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw errors.notFound('USER_NOT_EXISTS');

  const isValid = await compare(password, user.password);
  if (!isValid) throw errors.unauthorized();

  user.set('password', undefined, { strict: false });

  res.json({
    token: tokenSign(user),
    user,
  });
});

// GET /api/auth/me
export const getMeCtrl = asyncHandler(async (req, res) => {
  res.json(req.user);
});
