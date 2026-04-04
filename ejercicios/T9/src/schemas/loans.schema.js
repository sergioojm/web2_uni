import { z } from 'zod';

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Invalid ID'),
  }),
});

export const createLoanSchema = z.object({
  body: z.object({
    bookId: z.string().min(1, 'Book ID is required'),
  }),
});
