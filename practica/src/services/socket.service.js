import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/handleJwt.js';
import User from '../models/User.js';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ').pop();
      if (!token) return next(new Error('No token'));
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload._id);
      if (!user) return next(new Error('Usuario no encontrado'));
      socket.data.user = user;
      if (user.company) socket.join(`company:${user.company.toString()}`);
      next();
    } catch (err) {
      next(new Error('Auth WS inválida: ' + err.message));
    }
  });

  io.on('connection', (socket) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`socket conectado: ${socket.data.user?.email}`);
    }
  });

  return io;
};

export const emitToCompany = (companyId, event, payload) => {
  if (!io || !companyId) return;
  io.to(`company:${companyId.toString()}`).emit(event, payload);
};

export const closeSocket = () =>
  new Promise((resolve) => {
    if (!io) return resolve();
    io.close(() => resolve());
  });
