import { Router } from 'express';
import { getRooms, createRoom, getMessages } from '../controllers/rooms.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateBody, createRoomSchema } from '../validators/room.validator.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getRooms);
router.post('/', validateBody(createRoomSchema), createRoom);
router.get('/:id/messages', getMessages);

export default router;
