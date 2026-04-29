import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'ObjectId inválido');

const addressSchema = z
  .object({
    street: z.string().optional(),
    number: z.string().optional(),
    postal: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional()
  })
  .optional();

const base = {
  name: z.string().min(1).transform((v) => v.trim()),
  projectCode: z.string().min(1).transform((v) => v.trim()),
  client: objectId,
  address: addressSchema,
  email: z.string().email().optional(),
  notes: z.string().optional(),
  active: z.boolean().optional()
};

export const createProjectSchema = z.object({
  body: z.object(base)
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: base.name.optional(),
    projectCode: base.projectCode.optional(),
    client: base.client.optional(),
    address: base.address,
    email: base.email,
    notes: base.notes,
    active: base.active
  }),
  params: z.object({ id: objectId })
});

export const idParamSchema = z.object({
  params: z.object({ id: objectId })
});
