import { z } from 'zod';

// ---------------------------------------------------------------------------
// Learning Path & Lesson Schemas
// ---------------------------------------------------------------------------

/** Valid levels for learning paths (from seed data in 03-database-design) */
export const LEARNING_LEVELS = [
  'digital-citizen',
  'ai-user',
  'software-user',
  'junior-developer',
  'senior-developer',
  'open-source-maintainer',
] as const;

export type LearningLevel = (typeof LEARNING_LEVELS)[number];

/** Label map (th/en) for display */
export const LEVEL_LABELS: Record<LearningLevel, { th: string; en: string }> = {
  'digital-citizen':        { th: 'พลเมืองดิจิทัล',          en: 'Digital Citizen' },
  'ai-user':                { th: 'ผู้ใช้ AI',               en: 'AI User' },
  'software-user':          { th: 'ผู้ใช้ซอฟต์แวร์',         en: 'Software User' },
  'junior-developer':       { th: 'นักพัฒนาระดับเริ่มต้น',   en: 'Junior Developer' },
  'senior-developer':       { th: 'นักพัฒนาระดับสูง',        en: 'Senior Developer' },
  'open-source-maintainer': { th: 'ผู้ดูแลโอเพนซอร์ส',      en: 'Open Source Maintainer' },
};

// ---------------------------------------------------------------------------
// API Request Schemas
// ---------------------------------------------------------------------------

/** PUT /api/v1/learning-paths/{id}/progress */
export const lessonCompletionSchema = z.object({
  lessonId: z.string().min(1, 'lessonId is required'),
});

/** POST /api/v1/quizzes/{id}/attempts */
export const quizAttemptSchema = z.object({
  answers: z
    .array(z.number().int().min(0))
    .min(1, 'At least one answer is required'),
});

// ---------------------------------------------------------------------------
// Firestore Document Types
// ---------------------------------------------------------------------------

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  level: LearningLevel;
  estimatedMinutes: number;
  lessonCount: number;
  quizId: string | null;
  prerequisitePathId: string | null;
  status: 'draft' | 'published';
  coverImagePath?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any;
}

export interface Lesson {
  id: string;
  title: string;
  order: number;
  content: string; // Markdown
  estimatedMinutes: number;
}

export interface QuizQuestion {
  questionText: string;
  options: string[];
  type: 'multiple_choice';
}

export interface Quiz {
  id: string;
  pathId: string;
  title: string;
  passingScore: number; // 0-100
  maxAttempts: number;
  timeLimit: number | null; // in seconds, null = unlimited
  questions: QuizQuestion[];
}

export interface UserPathProgress {
  completedLessons: Record<string, string>; // { lessonId: ISO timestamp }
  quizAttempts: number;
  quizPassed: boolean;
  lastQuizScore: number;
  completedAt: string | null;
  percentage: number;
}

export interface Certificate {
  id: string;
  userId: string;
  pathId: string;
  pathTitle: string;
  userName: string;
  certificateNumber: string;
  verificationCode: string;
  pdfPath: string;
  issuedAt: any; // Firestore Timestamp
  revokedAt: any | null;
}
