import { z } from 'zod';

export const createPodcastSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200).trim(),
    description: z.string().min(10).trim(),
    category: z.enum(['tech', 'science', 'history', 'comedy', 'news']).optional(),
    duration: z.number().min(60).optional(),
    episodes: z.number().int().min(1).optional(),
  }),
});

export const updatePodcastSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200).trim().optional(),
    description: z.string().min(10).trim().optional(),
    category: z.enum(['tech', 'science', 'history', 'comedy', 'news']).optional(),
    duration: z.number().min(60).optional(),
    episodes: z.number().int().min(1).optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID no válido'),
  }),
});
