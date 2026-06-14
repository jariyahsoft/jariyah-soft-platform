import { adminDb } from '@/lib/firebase/admin';
import { withRole } from '@/lib/api/withRole';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { serializeAdminData } from '@/lib/admin/server-utils';

export const GET = withRole('admin', async (_req, context) => {
  try {
    const { uid } = await context.params;
    const userDoc = await adminDb.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return errorResponse(ApiErrors.NOT_FOUND.code, 'User not found', ApiErrors.NOT_FOUND.status);
    }

    const auditSnap = await adminDb
      .collection('audit_logs')
      .where('resourceType', '==', 'user')
      .where('resourceId', '==', uid)
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();

    return successResponse({
      user: serializeAdminData({ id: userDoc.id, ...userDoc.data() }),
      auditLogs: serializeAdminData(auditSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))),
    });
  } catch (error) {
    console.error('Error loading admin user detail:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to load user', ApiErrors.INTERNAL_ERROR.status);
  }
});
