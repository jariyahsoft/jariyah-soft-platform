import { z } from 'zod';

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(20).max(2000),
});
