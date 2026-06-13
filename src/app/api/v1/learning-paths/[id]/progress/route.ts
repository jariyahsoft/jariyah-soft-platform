import { adminDb } from '@/lib/firebase/admin';
import { withRole } from '@/lib/api/withRole';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { lessonCompletionSchema } from '@/lib/validators/learning';
import { saveLessonCompletion } from '@/lib/learning/data';

// PUT /api/v1/learning-paths/{id}/progress
export const PUT = withRole('member', async (req: any, context: any) => {
  try {
    const { id: pathId } = await context.params;
    const uid = req.user.uid;

    const body = await req.json();
    const parsed = lessonCompletionSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        ApiErrors.VALIDATION_ERROR.code,
        ApiErrors.VALIDATION_ERROR.message,
        ApiErrors.VALIDATION_ERROR.status,
        parsed.error.issues.map((e: any) => ({ field: e.path.join('.'), reason: e.message }))
      );
    }

    // Verify path exists
    const pathDoc = await adminDb.collection('learning_paths').doc(pathId).get();
    if (!pathDoc.exists) {
      return errorResponse(
        ApiErrors.NOT_FOUND.code,
        'Learning path not found',
        ApiErrors.NOT_FOUND.status
      );
    }

    // Verify lesson exists in path
    const lessonDoc = await adminDb
      .collection('learning_paths')
      .doc(pathId)
      .collection('lessons')
      .doc(parsed.data.lessonId)
      .get();

    if (!lessonDoc.exists) {
      return errorResponse(
        ApiErrors.NOT_FOUND.code,
        'Lesson not found in this path',
        ApiErrors.NOT_FOUND.status
      );
    }

    const totalLessons = pathDoc.data()!.lessonCount || 1;
    const progress = await saveLessonCompletion(uid, pathId, parsed.data.lessonId, totalLessons);

    return successResponse(progress);
  } catch (error) {
    console.error('Error saving progress:', error);
    return errorResponse(
      ApiErrors.INTERNAL_ERROR.code,
      'Failed to save progress',
      ApiErrors.INTERNAL_ERROR.status
    );
  }
});
