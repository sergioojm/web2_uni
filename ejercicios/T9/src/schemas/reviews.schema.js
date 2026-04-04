import { z } from 'zod';

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Invalid ID'),
  }),
});

export const bookIdParamSchema = z.object({
  params: z.object({
    bookId: z.string().min(1, 'Invalid book ID'),
  }),
});

export const createReviewSchema = z.object({
  body: z.object({
    bookId: z.string().min(1, 'Book ID is required'),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().optional(),
  }),
});
