import * as admin from 'firebase-admin';
import type { AuthenticatedRequest } from '@/lib/api/withAuth';
import { withRole } from '@/lib/api/withRole';
import { ApiErrors, errorResponse, successResponse } from '@/lib/api/response';
import { adminDb } from '@/lib/firebase/admin';
import { createNotification, writeAuditLog } from '@/lib/admin/server-utils';
import { getModerationCollectionName, type ModerationResourceType } from '@/lib/moderation/data';

const TAKEDOWN_ACTION_STATUS: Record<string, string> = {
  hide: 'hidden',
  suspend: 'suspended',
  remove: 'removed',
};

const TAKEDOWN_REASON_CODES = new Set(['copyright', 'trademark', 'security_risk', 'malware']);

export const POST = withRole('admin', async (req: AuthenticatedRequest) => {
  try {
    const user = req.user;
    if (!user) {
      return errorResponse(ApiErrors.UNAUTHENTICATED.code, ApiErrors.UNAUTHENTICATED.message, ApiErrors.UNAUTHENTICATED.status);
    }

    const body = await req.json().catch(() => ({}));
    const resourceType = String(body.resourceType || '');
    const resourceId = String(body.resourceId || '').trim();
    const action = String(body.action || '').trim();
    const reasonCode = String(body.reasonCode || '').trim();
    const note = String(body.note || '').trim();

    if ((resourceType !== 'software' && resourceType !== 'article') || !resourceId) {
      return errorResponse(ApiErrors.VALIDATION_ERROR.code, 'Valid resourceType and resourceId are required', ApiErrors.VALIDATION_ERROR.status);
    }

    if (!TAKEDOWN_ACTION_STATUS[action] || !TAKEDOWN_REASON_CODES.has(reasonCode)) {
      return errorResponse(ApiErrors.VALIDATION_ERROR.code, 'Invalid takedown action or reasonCode', ApiErrors.VALIDATION_ERROR.status);
    }

    const collectionName = getModerationCollectionName(resourceType as ModerationResourceType);
    const resourceRef = adminDb.collection(collectionName).doc(resourceId);
    const now = admin.firestore.FieldValue.serverTimestamp();
    const ownerField = resourceType === 'software' ? 'ownerId' : 'authorId';
    const nextStatus = TAKEDOWN_ACTION_STATUS[action];

    const result = await adminDb.runTransaction(async (transaction) => {
      const snap = await transaction.get(resourceRef);
      if (!snap.exists) throw new Error('NOT_FOUND');
      const data = snap.data() ?? {};

      transaction.update(resourceRef, {
        status: nextStatus,
        takedown: {
          action,
          reasonCode,
          note,
          actorId: user.uid,
          appliedAt: now,
        },
        publicHiddenAt: now,
        searchSyncStatus: 'pending_remove',
        updatedAt: now,
      });

      const auditRef = adminDb.collection('audit_logs').doc();
      transaction.set(auditRef, {
        actorId: user.uid,
        action: `takedown.${action}`,
        resourceType,
        resourceId,
        reason: `${reasonCode}${note ? `: ${note}` : ''}`,
        before: { status: data.status ?? null },
        after: { status: nextStatus, reasonCode },
        metadata: { takedownAction: action },
        timestamp: now,
      });

      return {
        ownerId: String(data[ownerField] || ''),
        title: String(resourceType === 'software' ? data.name || resourceId : data.title || resourceId),
      };
    });

    if (result.ownerId) {
      await createNotification({
        userId: result.ownerId,
        type: `takedown.${action}`,
        title: 'Content takedown applied',
        body: `${result.title} was ${nextStatus}. Reason: ${reasonCode}.`,
        metadata: { resourceType, resourceId, action, reasonCode },
      });
    }

    await writeAuditLog({
      actorId: user.uid,
      action: 'takedown.notification_sent',
      resourceType,
      resourceId,
      metadata: { ownerId: result.ownerId, action, reasonCode },
    });

    return successResponse({ resourceType, resourceId, status: nextStatus });
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return errorResponse(ApiErrors.NOT_FOUND.code, 'Resource not found', ApiErrors.NOT_FOUND.status);
    }
    console.error('Error applying takedown:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to apply takedown', ApiErrors.INTERNAL_ERROR.status);
  }
});
