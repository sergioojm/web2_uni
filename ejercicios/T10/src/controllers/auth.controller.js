import User from '../models/user.model.js';
import { encrypt, compare } from '../utils/password.js';
import { tokenSign } from '../utils/jwt.js';
import { asyncHandler, errors } from '../utils/handleError.js';

// POST /api/auth/register
export const registerCtrl = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw errors.conflict('EMAIL_ALREADY_EXISTS');

  const hashed = await encrypt(password);
  const user = await User.create({ name, email, password: hashed });

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
  res.json({ data: req.user });
});
