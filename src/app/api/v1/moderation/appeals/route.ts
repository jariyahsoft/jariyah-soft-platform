import type { AuthenticatedRequest } from '@/lib/api/withAuth';
import { withRole } from '@/lib/api/withRole';
import { ApiErrors, errorResponse, successResponse } from '@/lib/api/response';
import { adminDb } from '@/lib/firebase/admin';
import { serializeAdminData } from '@/lib/admin/server-utils';

export const GET = withRole('moderator', async (_req: AuthenticatedRequest) => {
  try {
    const snap = await adminDb.collection('appeals').where('status', 'in', ['pending', 'escalated']).limit(50).get();
    const items = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const aDate = (a as FirebaseFirestore.DocumentData).createdAt?.toDate?.()?.getTime?.() ?? 0;
        const bDate = (b as FirebaseFirestore.DocumentData).createdAt?.toDate?.()?.getTime?.() ?? 0;
        return aDate - bDate;
      })
      .map((item) => serializeAdminData(item));

    return successResponse({ items });
  } catch (error) {
    console.error('Error listing appeals:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to list appeals', ApiErrors.INTERNAL_ERROR.status);
  }
});
