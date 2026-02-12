// src/schemas/cursos.schema.js
import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string()
      .min(3, 'El email debe tener al menos 3 caracteres')
      .max(30, 'El email no puede exceder 30 caracteres'),
    name: z.string()
      .min(4, 'El nombre debe tener al menos 3 caracteres')
      .max(15, 'El nombre no puede exceder 30 caracteres'),
    nivel: z.enum(['basico', 'intermedio', 'avanzado']),
  })
});
