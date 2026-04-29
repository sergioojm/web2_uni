import { AppError } from '../utils/AppError.js';

export const requireCompany = (req, _res, next) => {
  if (!req.user?.company) {
    return next(AppError.badRequest('El usuario no tiene compañía asociada'));
  }
  next();
};
