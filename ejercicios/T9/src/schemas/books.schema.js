import { z } from 'zod';

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Invalid ID'),
  }),
});

export const createBookSchema = z.object({
  body: z.object({
    isbn: z.string().min(1).max(20).trim(),
    title: z.string().min(1).max(200).trim(),
    author: z.string().min(1).max(100).trim(),
    genre: z.string().min(1).max(50).trim(),
    description: z.string().trim().optional(),
    publishedYear: z.number().int().min(1000).max(new Date().getFullYear()),
    copies: z.number().int().min(1),
  }),
});

export const updateBookSchema = z.object({
  body: z.object({
    isbn: z.string().min(1).max(20).trim().optional(),
    title: z.string().min(1).max(200).trim().optional(),
    author: z.string().min(1).max(100).trim().optional(),
    genre: z.string().min(1).max(50).trim().optional(),
    description: z.string().trim().optional(),
    publishedYear: z.number().int().min(1000).max(new Date().getFullYear()).optional(),
    copies: z.number().int().min(1).optional(),
  }),
});
