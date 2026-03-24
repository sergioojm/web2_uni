import { asyncHandler, errors } from '../utils/handleError.js';

const checkRol = (rol) => asyncHandler((req, res, next) => {
  if (req.user.role !== rol) throw errors.forbidden();
  next();
});

export default checkRol;
