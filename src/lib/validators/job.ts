import { z } from 'zod';

export const JOB_TYPES = ['full_time', 'part_time', 'freelance', 'internship'] as const;
export const WORK_MODES = ['remote', 'onsite', 'hybrid'] as const;
export const JOB_STATUSES = ['draft', 'submitted', 'under_review', 'published', 'expired', 'suspended', 'archived'] as const;

export type JobType = (typeof JOB_TYPES)[number];
export type WorkMode = (typeof WORK_MODES)[number];
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_TYPE_LABELS: Record<JobType, { th: string; en: string }> = {
  full_time: { th: 'งานประจำ', en: 'Full Time' },
  part_time: { th: 'งานพาร์ทไทม์', en: 'Part Time' },
  freelance: { th: 'ฟรีแลนซ์', en: 'Freelance' },
  internship: { th: 'ฝึกงาน', en: 'Internship' },
};

export const WORK_MODE_LABELS: Record<WorkMode, { th: string; en: string }> = {
  remote: { th: 'ทำงานจากที่บ้าน', en: 'Remote' },
  onsite: { th: 'ทำงานที่ออฟฟิศ', en: 'On-site' },
  hybrid: { th: 'ไฮบริด', en: 'Hybrid' },
};

// HTTPS + domain allowlist for application URLs
const ALLOWED_APPLICATION_DOMAINS = [
  'linkedin.com',
  'jobthai.com',
  'jobbkk.com',
  'jobsdb.com',
  'jobstreet.co.th',
  'th.indeed.com',
  'indeed.com',
  'glassdoor.com',
  'jobs.blognone.com',
  'forms.gle',
  'docs.google.com',
  'airtable.com',
  'typeform.com',
  'careers.google.com',
  'boards.greenhouse.io',
  'lever.co',
  'workable.com',
  'github.com',
  'notion.so',
];

export function isAllowedApplicationUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.replace(/^www\./, '');
    return ALLOWED_APPLICATION_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

const applicationUrlSchema = z
  .string()
  .url('Application URL must be a valid URL')
  .refine((v) => v.startsWith('https://'), 'Application URL must use HTTPS')
  .refine(
    (v) => isAllowedApplicationUrl(v),
    'Application URL must be from an allowed domain (LinkedIn, Indeed, JobThai, etc.)'
  );

export const createJobSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(120),
  organization: z.string().min(2, 'Organization must be at least 2 characters').max(120),
  description: z.string().min(20, 'Description must be at least 20 characters').max(10000),
  jobType: z.enum(JOB_TYPES),
  workMode: z.enum(WORK_MODES),
  location: z.string().max(200).optional(),
  skills: z.array(z.string().min(1).max(50)).min(1).max(20),
  applicationURL: applicationUrlSchema,
  salaryRange: z
    .object({
      min: z.number().int().nonnegative().optional(),
      max: z.number().int().nonnegative().optional(),
      currency: z.string().length(3).default('THB'),
    })
    .optional(),
  expiresAt: z.string().datetime('Expiry date must be a valid datetime'),
});

export const editJobSchema = createJobSchema.partial();

export interface JobData {
  id: string;
  ownerId: string;
  organization: string;
  title: string;
  description: string;
  jobType: JobType;
  workMode: WorkMode;
  location?: string;
  skills: string[];
  applicationURL: string;
  salaryRange?: {
    min?: number;
    max?: number;
    currency: string;
  };
  status: JobStatus;
  expiresAt: string; // ISO string
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}
