// src/schemas/cursos.schema.js
import { z } from 'zod';


export const createTareaSchema = z.object({
  body: z.object({
    title: z.string()
      .min(3, 'El título debe tener al menos 3 caracteres')
      .max(100, 'El título no puede exceder 100 caracteres'),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']),
  })
});

export const updateTareaSchema = z.object({
  body: z.object({
    title: z.string()
      .min(3, 'El título debe tener al menos 3 caracteres')
      .max(100, 'El título no puede exceder 100 caracteres').optional(),
    description: z.string().optional(),
    completed: z.enum(["true", "false"]).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser numérico'),
  })
});

export const filterTareaSchema = z.object({
  query: z.object({
    completed: z.enum(["true", "false"]).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
  })
})