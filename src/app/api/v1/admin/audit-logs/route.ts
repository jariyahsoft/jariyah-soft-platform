import { adminDb } from '@/lib/firebase/admin';
import { withAuth } from '@/lib/api/withAuth';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';

// GET /api/v1/admin/audit-logs
export const GET = withAuth(async (req: any) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(ApiErrors.FORBIDDEN.code, 'Requires admin role', ApiErrors.FORBIDDEN.status);
    }

    const searchParams = req.nextUrl.searchParams;
    const limitParam = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Math.min(limitParam, 100);
    const actor = searchParams.get('actor');
    const action = searchParams.get('action');
    const resourceType = searchParams.get('resourceType');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const cursor = searchParams.get('cursor');
    
    let query: FirebaseFirestore.Query = adminDb.collection('audit_logs');
    
    if (actor) {
      query = query.where('actorId', '==', actor);
    }
    if (action) {
      query = query.where('action', '==', action);
    }
    if (resourceType) {
      query = query.where('resourceType', '==', resourceType);
    }
    if (dateFrom) {
      query = query.where('timestamp', '>=', new Date(dateFrom));
    }
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.where('timestamp', '<=', endOfDay);
    }

    query = query.orderBy('timestamp', 'desc');

    if (cursor) {
      const cursorDoc = await adminDb.collection('audit_logs').doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    query = query.limit(limit + 1);

    const snapshot = await query.get();
    const logs: any[] = [];
    
    snapshot.docs.slice(0, limit).forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });

    const nextCursorDoc = snapshot.docs.length > limit ? snapshot.docs[limit - 1] : undefined;
    const nextCursor = nextCursorDoc ? nextCursorDoc.id : null;

    return successResponse({
      items: logs,
      totalCount: logs.length,
    }, { nextCursor });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to fetch audit logs', ApiErrors.INTERNAL_ERROR.status);
  }
});
