import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { withApiKey } from '@/lib/api/withApiKey';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { paginationSchema } from '@/lib/validators/shared';
import type { LearningPath } from '@/lib/validators/learning';

// GET /api/v1/learning-paths
export const GET = withApiKey(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    const parsedPagination = paginationSchema.safeParse({
      limit: searchParams.get('limit') || undefined,
      cursor: searchParams.get('cursor') || undefined,
    });

    if (!parsedPagination.success) {
      return errorResponse(
        ApiErrors.VALIDATION_ERROR.code,
        ApiErrors.VALIDATION_ERROR.message,
        ApiErrors.VALIDATION_ERROR.status,
        parsedPagination.error.issues.map((e) => ({ field: e.path.join('.'), reason: e.message }))
      );
    }

    let query: FirebaseFirestore.Query = adminDb
      .collection('learning_paths')
      .where('status', '==', 'published')
      .orderBy('createdAt', 'desc');

    const level = searchParams.get('level');
    if (level) {
      query = query.where('level', '==', level);
    }

    query = query.limit(parsedPagination.data.limit);

    if (parsedPagination.data.cursor) {
      const cursorDoc = await adminDb.collection('learning_paths').doc(parsedPagination.data.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const data: LearningPath[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as LearningPath));

    const lastDoc = snapshot.docs.at(-1);
    const nextCursor =
      snapshot.docs.length === parsedPagination.data.limit && lastDoc
        ? lastDoc.id
        : null;

    return successResponse(data, { nextCursor });
  } catch (error) {
    console.error('Error fetching learning paths:', error);
    return errorResponse(
      ApiErrors.INTERNAL_ERROR.code,
      'Failed to fetch learning paths',
      ApiErrors.INTERNAL_ERROR.status
    );
  }
});
