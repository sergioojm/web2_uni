import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export const signAccessToken = (user) =>
  jwt.sign({ _id: user._id, role: user.role }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn
  });

export const signRefreshToken = (user) =>
  jwt.sign({ _id: user._id, type: 'refresh' }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn
  });

export const verifyAccessToken = (token) =>
  jwt.verify(token, config.jwt.accessSecret);

export const verifyRefreshToken = (token) =>
  jwt.verify(token, config.jwt.refreshSecret);
