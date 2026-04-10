import User from '../models/user.model.js';
import { verifyToken } from '../utils/jwt.js';
import { errors } from '../utils/handleError.js';

export const authMiddleware = async (req, res, next) => {
  try {
    if (!req.headers.authorization) throw errors.unauthorized();

    const token = req.headers.authorization.split(' ').pop();
    const decoded = verifyToken(token);
    if (!decoded?.userId) throw errors.unauthorized();

    const user = await User.findById(decoded.userId);
    if (!user) throw errors.unauthorized();

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
