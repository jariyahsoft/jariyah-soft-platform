import { z } from 'zod';

export const articleDraftSchema = z.object({
  title: z.string().min(5).max(150),
  slug: z.string().optional(),
  excerpt: z.string().min(20).max(240),
  body: z.string().min(50),
  categoryId: z.string().min(1),
  tagIds: z.array(z.string()).max(20).default([]),
  language: z.enum(['th', 'en']).default('th'),
});

export const articleEditSchema = articleDraftSchema.partial();
