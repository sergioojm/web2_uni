import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'ObjectId inválido');

const workerSchema = z.object({
  name: z.string().min(1),
  hours: z.number().nonnegative()
});

const materialNote = z.object({
  format: z.literal('material'),
  client: objectId,
  project: objectId,
  description: z.string().optional(),
  workDate: z.coerce.date().optional(),
  material: z.string().min(1),
  quantity: z.number().nonnegative(),
  unit: z.string().optional()
});

const hoursNote = z.object({
  format: z.literal('hours'),
  client: objectId,
  project: objectId,
  description: z.string().optional(),
  workDate: z.coerce.date().optional(),
  hours: z.number().nonnegative().optional(),
  workers: z.array(workerSchema).optional()
});

const noteUnion = z
  .discriminatedUnion('format', [materialNote, hoursNote])
  .superRefine((data, ctx) => {
    if (data.format === 'hours') {
      const ok = data.hours != null || (data.workers && data.workers.length > 0);
      if (!ok) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Indica "hours" o al menos un "worker"',
          path: ['hours']
        });
      }
    }
  });

export const createDeliveryNoteSchema = z.object({
  body: noteUnion
});

export const idParamSchema = z.object({
  params: z.object({ id: objectId })
});
