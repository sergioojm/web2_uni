import { asyncHandler, errors } from '../utils/handleError.js';

const checkRol = (...roles) => asyncHandler((req, res, next) => {
  if (!roles.includes(req.user.role)) throw errors.forbidden();
  next();
});

export default checkRol;
