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

const baseClient = {
  name: z.string().min(1).transform((v) => v.trim()),
  cif: z.string().min(5).transform((v) => v.trim().toUpperCase()),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: addressSchema
};

export const createClientSchema = z.object({
  body: z.object(baseClient)
});

export const updateClientSchema = z.object({
  body: z.object({
    name: baseClient.name.optional(),
    cif: baseClient.cif.optional(),
    email: baseClient.email,
    phone: baseClient.phone,
    address: baseClient.address
  }),
  params: z.object({ id: objectId })
});

export const idParamSchema = z.object({
  params: z.object({ id: objectId })
});

const numStr = (def) =>
  z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .optional()
    .default(def);

export const listClientSchema = z.object({
  query: z.object({
    page: numStr('1'),
    limit: numStr('10'),
    name: z.string().optional(),
    sort: z.string().optional()
  })
});
