import prisma from '../config/db.js';
import { encrypt, compare } from '../utils/handlePassword.js';
import { tokenSign } from '../utils/handleJwt.js';
import { asyncHandler, errors } from '../utils/handleError.js';

export const registerCtrl = asyncHandler(async (req, res) => {
  const { email, password, name, role } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw errors.conflict('EMAIL_ALREADY_EXISTS');

  const hashed = await encrypt(password);
  const user = await prisma.user.create({
    data: { email, name, password: hashed, role },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  res.status(201).json({
    token: tokenSign(user),
    user,
  });
});

export const loginCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw errors.notFound('USER');

  const isValid = await compare(password, user.password);
  if (!isValid) throw errors.unauthorized();

  const { password: _, ...userWithoutPassword } = user;

  res.json({
    token: tokenSign(user),
    user: userWithoutPassword,
  });
});

export const getMeCtrl = asyncHandler(async (req, res) => {
  const { password: _, ...userWithoutPassword } = req.user;
  res.json({ data: userWithoutPassword });
});
