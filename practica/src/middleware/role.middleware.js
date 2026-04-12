import { AppError } from '../utils/AppError.js';

export const checkRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized('No autenticado'));
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden('No autorizado'));
    }
    next();
  };
