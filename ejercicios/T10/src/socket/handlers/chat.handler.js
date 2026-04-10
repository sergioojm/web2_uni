import Message from '../../models/message.model.js';

export const registerChatHandlers = (io, socket) => {
  // Enviar mensaje a una sala
  socket.on('chat:message', async ({ roomId, content }) => {
    try {
      if (!content?.trim()) return;

      const message = await Message.create({
        room: roomId,
        user: socket.user._id,
        content: content.trim(),
      });

      // Emitir a todos en la sala (incluido el emisor)
      io.to(roomId).emit('chat:message', {
        _id: message._id,
        user: { _id: socket.user._id, name: socket.user.name },
        content: message.content,
        timestamp: message.createdAt,
      });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Indicador "escribiendo..."
  socket.on('chat:typing', ({ roomId }) => {
    socket.to(roomId).emit('chat:typing', {
      user: { _id: socket.user._id, name: socket.user.name },
    });
  });
};
