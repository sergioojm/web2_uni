import Room from '../models/room.model.js';
import Message from '../models/message.model.js';
import { asyncHandler, errors } from '../utils/handleError.js';

// GET /api/rooms
export const getRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find()
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });

  res.json({ data: rooms });
});

// POST /api/rooms
export const createRoom = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const room = await Room.create({
    name,
    description,
    createdBy: req.user._id,
  });

  res.status(201).json({ data: room });
});

// GET /api/rooms/:id/messages
export const getMessages = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) throw errors.notFound('Sala');

  const { page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const messages = await Message.find({ room: req.params.id })
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.json({ data: messages.reverse() });
});
