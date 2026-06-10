import { z } from 'zod';

const httpsUrlSchema = z
  .string()
  .url()
  .refine((value) => value.startsWith('https://'), 'URL must use HTTPS');

const optionalHttpsUrlSchema = z
  .union([httpsUrlSchema, z.literal('')])
  .optional()
  .transform((value) => (value === '' ? undefined : value));

export const softwareDraftSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z.string().min(3).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  shortDescription: z.string().min(10).max(240),
  description: z.string().max(10000).optional().default(''),
  categoryId: z.string().min(1),
  tagIds: z.array(z.string()).max(20).optional().default([]),
  platforms: z.array(z.string()).min(1).max(8),
  licenseId: z.string().min(1),
  logoPath: z.string().max(500).optional(),
  screenshotPaths: z.array(z.string()).max(8).optional().default([]),
  repositoryURL: optionalHttpsUrlSchema,
  websiteURL: optionalHttpsUrlSchema,
  downloadURL: optionalHttpsUrlSchema,
  fileSize: z.string().max(80).optional(),
});

export const softwareEditSchema = softwareDraftSchema.partial();
