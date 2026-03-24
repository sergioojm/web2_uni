import User from '../models/user.model.js';
import { verifyToken } from '../utils/handleJwt.js';
import { asyncHandler, errors } from '../utils/handleError.js';

const authMiddleware = asyncHandler(async (req, res, next) => {
  if (!req.headers.authorization) throw errors.unauthorized();

  const token = req.headers.authorization.split(' ').pop();
  const decoded = verifyToken(token);

  if (!decoded || !decoded.userId) throw errors.unauthorized();

  const user = await User.findById(decoded.userId);
  if (!user) throw errors.unauthorized();

  req.user = user;
  next();
});

export default authMiddleware;
