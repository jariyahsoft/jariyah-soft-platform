import { adminDb } from '@/lib/firebase/admin';
import type { LearningPath, Lesson, UserPathProgress } from '@/lib/validators/learning';

// ---------------------------------------------------------------------------
// Learning Paths
// ---------------------------------------------------------------------------

/**
 * Fetch all published learning paths, optionally filtered by level.
 */
export async function listPublishedPaths(options?: {
  level?: string;
}): Promise<LearningPath[]> {
  let query: FirebaseFirestore.Query = adminDb
    .collection('learning_paths')
    .where('status', '==', 'published')
    .orderBy('createdAt', 'desc');

  if (options?.level) {
    query = query.where('level', '==', options.level);
  }

  const snap = await query.get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as LearningPath));
}

/**
 * Fetch a single learning path by ID, including its lessons subcollection.
 */
export async function getPathWithLessons(
  pathId: string
): Promise<{ path: LearningPath; lessons: Lesson[] } | null> {
  const pathDoc = await adminDb.collection('learning_paths').doc(pathId).get();
  if (!pathDoc.exists) return null;

  const path = { id: pathDoc.id, ...pathDoc.data() } as LearningPath;

  const lessonsSnap = await adminDb
    .collection('learning_paths')
    .doc(pathId)
    .collection('lessons')
    .orderBy('order', 'asc')
    .get();

  const lessons = lessonsSnap.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Lesson)
  );

  return { path, lessons };
}

/**
 * Fetch a single lesson by pathId + lessonId.
 */
export async function getLesson(
  pathId: string,
  lessonId: string
): Promise<Lesson | null> {
  const doc = await adminDb
    .collection('learning_paths')
    .doc(pathId)
    .collection('lessons')
    .doc(lessonId)
    .get();

  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Lesson;
}

// ---------------------------------------------------------------------------
// User Progress
// ---------------------------------------------------------------------------

/**
 * Get the user's progress for a specific learning path.
 */
export async function getUserProgress(
  uid: string,
  pathId: string
): Promise<UserPathProgress | null> {
  const doc = await adminDb
    .collection('user_progress')
    .doc(uid)
    .collection('paths')
    .doc(pathId)
    .get();

  if (!doc.exists) return null;
  return doc.data() as UserPathProgress;
}

/**
 * Get progress for all paths a user has started.
 */
export async function getAllUserProgress(
  uid: string
): Promise<Record<string, UserPathProgress>> {
  const snap = await adminDb
    .collection('user_progress')
    .doc(uid)
    .collection('paths')
    .get();

  const result: Record<string, UserPathProgress> = {};
  snap.docs.forEach((doc) => {
    result[doc.id] = doc.data() as UserPathProgress;
  });
  return result;
}

/**
 * Save lesson completion and recalculate percentage.
 */
export async function saveLessonCompletion(
  uid: string,
  pathId: string,
  lessonId: string,
  totalLessons: number
): Promise<UserPathProgress> {
  const ref = adminDb
    .collection('user_progress')
    .doc(uid)
    .collection('paths')
    .doc(pathId);

  const doc = await ref.get();
  const existing: UserPathProgress = doc.exists
    ? (doc.data() as UserPathProgress)
    : {
        completedLessons: {},
        quizAttempts: 0,
        quizPassed: false,
        lastQuizScore: 0,
        completedAt: null,
        percentage: 0,
      };

  // Mark lesson as completed
  existing.completedLessons[lessonId] = new Date().toISOString();

  // Recalculate percentage (lessons only, quiz completion handled separately)
  const completedCount = Object.keys(existing.completedLessons).length;
  existing.percentage = Math.round((completedCount / totalLessons) * 100);

  await ref.set(existing, { merge: true });

  return existing;
}
