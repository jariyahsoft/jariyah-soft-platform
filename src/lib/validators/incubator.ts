import { z } from 'zod';

export const INCUBATOR_STAGES = ['idea', 'prototype', 'beta', 'stable', 'mature'] as const;
export const INCUBATOR_STATUSES = ['draft', 'submitted', 'under_review', 'published', 'suspended', 'archived'] as const;
export const MENTOR_AVAILABILITIES = ['available', 'limited', 'unavailable'] as const;

export type IncubatorStage = (typeof INCUBATOR_STAGES)[number];
export type IncubatorStatus = (typeof INCUBATOR_STATUSES)[number];
export type MentorAvailability = (typeof MENTOR_AVAILABILITIES)[number];

export const STAGE_LABELS: Record<IncubatorStage, { th: string; en: string }> = {
  idea: { th: 'ไอเดีย', en: 'Idea' },
  prototype: { th: 'ต้นแบบ', en: 'Prototype' },
  beta: { th: 'เบตา', en: 'Beta' },
  stable: { th: 'เสถียร', en: 'Stable' },
  mature: { th: 'สมบูรณ์', en: 'Mature' },
};

export const AVAILABILITY_LABELS: Record<MentorAvailability, { th: string; en: string }> = {
  available: { th: 'พร้อมรับ', en: 'Available' },
  limited: { th: 'จำกัด', en: 'Limited' },
  unavailable: { th: 'ไม่พร้อม', en: 'Unavailable' },
};

const optionalHttpsUrlSchema = z
  .union([
    z.string().url().refine((v) => v.startsWith('https://'), 'URL must use HTTPS'),
    z.literal(''),
  ])
  .optional()
  .transform((v) => (v === '' ? undefined : v));

export const createIncubatorSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters').max(120),
  description: z.string().min(20, 'Description must be at least 20 characters').max(10000),
  stage: z.enum(INCUBATOR_STAGES),
  repositoryURL: optionalHttpsUrlSchema,
  skillNeeds: z.array(z.string().min(1).max(50)).min(1, 'At least one skill needed').max(20),
});

export const editIncubatorSchema = createIncubatorSchema.partial();

export const contributorApplicationSchema = z.object({
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000),
  skills: z.array(z.string().min(1).max(50)).min(1, 'At least one skill required').max(10),
});

export const mentorProfileSchema = z.object({
  expertise: z.array(z.string().min(1).max(50)).min(1, 'At least one expertise required').max(10),
  bio: z.string().min(10, 'Bio must be at least 10 characters').max(2000),
  availability: z.enum(MENTOR_AVAILABILITIES),
  maxProjects: z.number().int().min(1).max(10).default(3),
});

export interface IncubatorProjectData {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  stage: IncubatorStage;
  repositoryURL?: string;
  skillNeeds: string[];
  mentorIds: string[];
  contributorIds: string[];
  status: IncubatorStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MentorProfileData {
  uid: string;
  displayName?: string;
  expertise: string[];
  bio: string;
  availability: MentorAvailability;
  maxProjects: number;
  activeProjectCount: number;
  status: 'active' | 'inactive';
  updatedAt: string;
}

export interface ContributorApplicationData {
  uid: string;
  displayName?: string;
  message: string;
  skills: string[];
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: string;
}
