import { z } from 'zod';

const httpsUrlSchema = z
  .string()
  .url()
  .refine((value) => value.startsWith('https://'), 'URL must use HTTPS');

const optionalHttpsUrlSchema = z
  .union([httpsUrlSchema, z.literal('')])
  .optional()
  .nullable()
  .transform((value) => (value === '' ? null : value));

const githubUsernameSchema = z
  .string()
  .trim()
  .regex(/^[a-z\d](?:[a-z\d-]{0,38}[a-z\d])?$/i, 'GitHub username must be a valid GitHub handle')
  .transform((value) => value.toLowerCase());

const socialLink = (domainPattern: RegExp, message: string) => {
  return optionalHttpsUrlSchema.refine(
    (val) => !val || domainPattern.test(val),
    { message }
  );
};

export const developerProfileSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name must not exceed 80 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(80, 'Slug must not exceed 80 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must consist of lowercase letters, numbers, and hyphens (no leading or trailing hyphens)'),
  bio: z
    .string()
    .max(2000, 'Bio must not exceed 2,000 characters')
    .optional()
    .nullable()
    .transform((val) => val || ''),
  skills: z
    .array(z.string().max(50))
    .max(30, 'Maximum of 30 skills allowed')
    .optional()
    .default([]),
  githubUsername: z
    .union([githubUsernameSchema, z.literal('')])
    .optional()
    .nullable()
    .transform((val) => (val ? val : null)),
  websiteURL: optionalHttpsUrlSchema,
  socialLinks: z
    .object({
      linkedin: socialLink(/linkedin\.com\//, 'LinkedIn link must contain linkedin.com/'),
      twitter: socialLink(/(twitter\.com|x\.com)\//, 'Twitter/X link must contain twitter.com/ or x.com/'),
      facebook: socialLink(/facebook\.com\//, 'Facebook link must contain facebook.com/'),
      youtube: socialLink(/youtube\.com\//, 'YouTube link must contain youtube.com/'),
    })
    .partial()
    .optional()
    .default({}),
  photoURL: optionalHttpsUrlSchema,
  coverURL: optionalHttpsUrlSchema,
});

export type DeveloperProfileInput = z.infer<typeof developerProfileSchema>;
