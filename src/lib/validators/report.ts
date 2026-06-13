import { z } from 'zod';

export const REPORT_TARGET_TYPES = ['software', 'article', 'comment', 'review'] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export const REPORT_REASON_CODES = [
  'spam',
  'inappropriate_content',
  'misinformation',
  'copyright',
  'other',
] as const;
export type ReportReasonCode = (typeof REPORT_REASON_CODES)[number];

export const REPORT_ACTIONS = [
  'dismiss',
  'request_changes',
  'hide',
  'suspend',
  'escalate',
] as const;
export type ReportAction = (typeof REPORT_ACTIONS)[number];

export const createReportSchema = z.object({
  targetType: z.enum(REPORT_TARGET_TYPES),
  targetId: z.string().min(1).max(128),
  reasonCode: z.enum(REPORT_REASON_CODES),
  details: z.string().max(500).optional(),
});

export const reportActionSchema = z.object({
  action: z.enum(REPORT_ACTIONS),
  reason: z.string().min(1).max(1000),
});
