import { z } from 'zod';
import { validateBody } from './auth.validator.js';

export const createRoomSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(50),
  description: z.string().max(200).optional().default(''),
});

export { validateBody };
