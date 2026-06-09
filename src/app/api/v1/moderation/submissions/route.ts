import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { withRole } from '@/lib/api/withRole';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';

// GET /api/v1/moderation/submissions
export const GET = withRole('moderator', async (req: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'software' | 'articles'
    
    if (!type || (type !== 'software' && type !== 'articles')) {
      return errorResponse(
        ApiErrors.VALIDATION_ERROR.code,
        "Query parameter 'type' must be 'software' or 'articles'",
        ApiErrors.VALIDATION_ERROR.status
      );
    }

    const snapshot = await adminDb.collection(type)
      .where('status', '==', 'pending')
      .orderBy('updatedAt', 'asc')
      .limit(50)
      .get();

    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return successResponse(data);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to fetch submissions', ApiErrors.INTERNAL_ERROR.status);
  }
});
