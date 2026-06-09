import { z } from 'zod';

export const softwareDraftSchema = z.object({
  name: z.string().min(3).max(100),
  shortDescription: z.string().min(10).max(200),
  categoryId: z.string().min(1),
  platforms: z.array(z.string()).min(1),
  licenseId: z.string().min(1),
});

export const softwareEditSchema = softwareDraftSchema.partial();
