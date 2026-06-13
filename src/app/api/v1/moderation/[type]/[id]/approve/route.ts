import { adminDb } from '@/lib/firebase/admin';
import { withAuth } from '@/lib/api/withAuth';
import { successResponse, errorResponse, ApiErrors, generateRequestId } from '@/lib/api/response';
import * as admin from 'firebase-admin';
import { getModerationCollectionName, type ModerationResourceType } from '@/lib/moderation/data';

// POST /api/v1/moderation/[type]/[id]/approve
export const POST = withAuth(async (req: any, { params }: { params: Promise<{ type: string; id: string }> }) => {
  try {
    const { type, id } = await params;

    if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
      return errorResponse(ApiErrors.FORBIDDEN.code, 'Requires moderator role', ApiErrors.FORBIDDEN.status);
    }

    if (type !== 'software' && type !== 'article' && type !== 'review') {
      return errorResponse(ApiErrors.VALIDATION_ERROR.code, 'Invalid type', ApiErrors.VALIDATION_ERROR.status);
    }

    const collectionName = getModerationCollectionName(type as ModerationResourceType);
    const requestId = req.headers.get('x-request-id') || generateRequestId();

    const result = await adminDb.runTransaction(async (transaction) => {
      const docRef = adminDb.collection(collectionName).doc(id);
      const docSnap = await transaction.get(docRef);

      if (!docSnap.exists) {
        throw new Error('NOT_FOUND');
      }

      const data = docSnap.data();
      const ownerId = type === 'software' ? data?.ownerId : type === 'article' ? data?.authorId : data?.userId;

      if (ownerId === req.user.uid) {
        throw new Error('SELF_APPROVAL');
      }

      if (data?.status !== 'pending') {
        throw new Error('INVALID_STATUS');
      }

      const now = admin.firestore.FieldValue.serverTimestamp();
      const nextStatus = type === 'review' ? 'approved' : 'published';
      const moderationStatus = 'approved';

      // Update the document
      transaction.update(docRef, {
        status: nextStatus,
        moderationStatus,
        ...(type === 'review' ? {} : { publishedAt: now }),
        updatedAt: now,
      });

      // Create Audit Log
      const auditLogRef = adminDb.collection('audit_logs').doc();
      transaction.set(auditLogRef, {
        actorId: req.user.uid,
        moderatorId: req.user.uid,
        action: 'approve',
        resourceType: type,
        resourceId: id,
        reason: 'Approved by moderator',
        before: { status: data?.status ?? 'unknown' },
        after: { status: nextStatus, moderationStatus },
        requestId,
        timestamp: now,
      });

      return { id: docSnap.id, status: nextStatus, moderationStatus };
    });

    return successResponse(result, { requestId });
  } catch (error: any) {
    console.error('Error approving submission:', error);
    if (error.message === 'NOT_FOUND') {
      return errorResponse(ApiErrors.NOT_FOUND.code, 'Submission not found', ApiErrors.NOT_FOUND.status);
    }
    if (error.message === 'SELF_APPROVAL') {
      return errorResponse(ApiErrors.BUSINESS_RULE_VIOLATION.code, 'Cannot approve own submission', ApiErrors.BUSINESS_RULE_VIOLATION.status);
    }
    if (error.message === 'INVALID_STATUS') {
      return errorResponse(ApiErrors.BUSINESS_RULE_VIOLATION.code, 'Submission is not pending', ApiErrors.BUSINESS_RULE_VIOLATION.status);
    }
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to approve submission', ApiErrors.INTERNAL_ERROR.status);
  }
});
