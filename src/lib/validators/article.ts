import { z } from 'zod';

export const articleDraftSchema = z.object({
  title: z.string().min(5).max(150),
  body: z.string().min(50),
  categoryId: z.string().min(1),
  language: z.enum(['th', 'en']).default('th'),
});

export const articleEditSchema = articleDraftSchema.partial();
