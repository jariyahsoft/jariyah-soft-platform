import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import type { AuthenticatedRequest } from '@/lib/api/withAuth';
import { withAuth } from '@/lib/api/withAuth';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { createNotification, writeAuditLog } from '@/lib/admin/server-utils';

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return errorResponse(ApiErrors.UNAUTHENTICATED.code, 'Unauthenticated', ApiErrors.UNAUTHENTICATED.status);
    }
    const body = (await req.json()) as Record<string, unknown>;
    const type = body.type;

    if (type !== 'export' && type !== 'deletion') {
      return errorResponse(ApiErrors.VALIDATION_ERROR.code, 'Invalid PDPA request type', ApiErrors.VALIDATION_ERROR.status);
    }

    if (type === 'deletion' && body.reauthConfirmed !== true) {
      return errorResponse(
        ApiErrors.VALIDATION_ERROR.code,
        'Deletion requests require recent re-authentication confirmation',
        ApiErrors.VALIDATION_ERROR.status
      );
    }

    const pendingSnap = await adminDb
      .collection('pdpa_requests')
      .where('userId', '==', uid)
      .where('type', '==', type)
      .where('status', 'in', ['queued', 'processing'])
      .limit(1)
      .get();

    if (!pendingSnap.empty) {
      return errorResponse(ApiErrors.CONFLICT.code, 'A matching PDPA request is already queued', ApiErrors.CONFLICT.status);
    }

    const ref = await adminDb.collection('pdpa_requests').add({
      userId: uid,
      type,
      status: 'queued',
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
      processedAt: null,
      expiresAt: null,
      downloadURL: null,
      reauthConfirmed: body.reauthConfirmed === true,
      locale: typeof body.locale === 'string' ? body.locale : 'th',
    });

    await Promise.all([
      writeAuditLog({
        actorId: uid,
        action: type === 'export' ? 'privacy.export_requested' : 'privacy.deletion_requested',
        resourceType: 'pdpa_request',
        resourceId: ref.id,
        after: { userId: uid, type, status: 'queued' },
      }),
      createNotification({
        userId: uid,
        type: type === 'export' ? 'privacy.export.queued' : 'privacy.deletion.queued',
        title: type === 'export' ? 'Data export requested' : 'Data deletion requested',
        body:
          type === 'export'
            ? 'Your data export has been queued for processing.'
            : 'Your deletion request has been queued for processing.',
        metadata: { requestId: ref.id },
      }),
    ]);

    return successResponse({ requestId: ref.id, status: 'queued', type }, {}, 201);
  } catch (error) {
    console.error('Failed to create PDPA request:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to create PDPA request', ApiErrors.INTERNAL_ERROR.status);
  }
});
