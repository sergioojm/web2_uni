import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { registerRoomHandlers } from './handlers/room.handler.js';
import { registerChatHandlers } from './handlers/chat.handler.js';

// Mapa en memoria: userId -> socketId
export const onlineUsers = new Map();

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Middleware JWT — se ejecuta en cada conexión nueva
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('TOKEN_REQUIRED'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) return next(new Error('USER_NOT_FOUND'));
      socket.user = user;
      next();
    } catch {
      next(new Error('TOKEN_INVALID'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🔌 Conectado: ${socket.user.name} (${socket.id})`);

    // Registrar como online
    onlineUsers.set(userId, socket.id);
    io.emit('user:online', { userId, name: socket.user.name });

    // Registrar handlers de salas y chat
    registerRoomHandlers(io, socket);
    registerChatHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log(`❌ Desconectado: ${socket.user.name}`);
      onlineUsers.delete(userId);
      io.emit('user:offline', { userId });
    });
  });

  return io;
};
