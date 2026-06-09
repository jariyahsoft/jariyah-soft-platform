import { z } from 'zod';

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().min(10).max(1000).optional(),
});
