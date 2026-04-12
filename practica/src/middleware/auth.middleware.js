import User from '../models/User.js';
import { verifyAccessToken } from '../utils/handleJwt.js';
import { AppError } from '../utils/AppError.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header) throw AppError.unauthorized('No token');

    const token = header.split(' ').pop();
    const payload = verifyAccessToken(token);
    if (!payload?._id) throw AppError.unauthorized('Token inválido');

    const user = await User.findOne({ _id: payload._id, deleted: false });
    if (!user) throw AppError.unauthorized('Usuario no encontrado');

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(AppError.unauthorized('Sesión inválida'));
  }
};
