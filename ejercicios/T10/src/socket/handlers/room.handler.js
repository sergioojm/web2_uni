import Room from '../../models/room.model.js';
import Message from '../../models/message.model.js';

export const registerRoomHandlers = (io, socket) => {
  // Unirse a una sala
  socket.on('room:join', async ({ roomId }) => {
    try {
      const room = await Room.findById(roomId);
      if (!room) return socket.emit('error', { message: 'Sala no encontrada' });

      socket.join(roomId);

      // Historial de mensajes (últimos 50)
      const messages = await Message.find({ room: roomId })
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .limit(50);

      // Usuarios actuales en la sala via Socket.IO
      const roomSockets = await io.in(roomId).fetchSockets();
      const users = roomSockets.map((s) => ({
        _id: s.user._id,
        name: s.user.name,
      }));

      // Confirmar al que entra
      socket.emit('room:joined', {
        room,
        messages: messages.reverse(),
        users,
      });

      // Notificar a los demás en la sala
      socket.to(roomId).emit('room:user-joined', {
        user: { _id: socket.user._id, name: socket.user.name },
      });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Salir de una sala
  socket.on('room:leave', ({ roomId }) => {
    socket.leave(roomId);
    socket.to(roomId).emit('room:user-left', {
      user: { _id: socket.user._id, name: socket.user.name },
    });
  });
};
