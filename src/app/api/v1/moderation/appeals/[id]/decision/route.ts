import * as admin from 'firebase-admin';
import type { AuthenticatedRequest } from '@/lib/api/withAuth';
import { withRole } from '@/lib/api/withRole';
import { ApiErrors, errorResponse, successResponse } from '@/lib/api/response';
import { adminDb } from '@/lib/firebase/admin';
import { createNotification, writeAuditLog } from '@/lib/admin/server-utils';
import { getModerationCollectionName, type ModerationResourceType } from '@/lib/moderation/data';

type RouteParams = { params: Promise<{ id: string }> };

export const POST = withRole('moderator', async (req: AuthenticatedRequest, context: RouteParams) => {
  try {
    const user = req.user;
    if (!user) {
      return errorResponse(ApiErrors.UNAUTHENTICATED.code, ApiErrors.UNAUTHENTICATED.message, ApiErrors.UNAUTHENTICATED.status);
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const decision = String(body.decision || '');
    const note = String(body.note || '').trim();

    if (decision !== 'overturn' && decision !== 'uphold') {
      return errorResponse(ApiErrors.VALIDATION_ERROR.code, 'decision must be overturn or uphold', ApiErrors.VALIDATION_ERROR.status);
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const appealRef = adminDb.collection('appeals').doc(id);

    const result = await adminDb.runTransaction(async (transaction) => {
      const appealSnap = await transaction.get(appealRef);
      if (!appealSnap.exists) throw new Error('NOT_FOUND');

      const appeal = appealSnap.data() ?? {};
      if (appeal.status !== 'pending' && appeal.status !== 'escalated') throw new Error('INVALID_STATUS');
      if (appeal.originalModeratorId === user.uid && user.role !== 'admin') throw new Error('ORIGINAL_REVIEWER');

      const resourceType = String(appeal.resourceType) as ModerationResourceType;
      if (resourceType !== 'software' && resourceType !== 'article') throw new Error('INVALID_RESOURCE');

      const resourceRef = adminDb.collection(getModerationCollectionName(resourceType)).doc(String(appeal.resourceId));
      const resourceSnap = await transaction.get(resourceRef);
      if (!resourceSnap.exists) throw new Error('RESOURCE_NOT_FOUND');
      const resource = resourceSnap.data() ?? {};

      const appealStatus = decision === 'overturn' ? 'overturned' : 'upheld';
      const appealUpdate = {
        status: appealStatus,
        final: true,
        reviewerId: user.uid,
        reviewedAt: now,
        decisionNote: note,
        updatedAt: now,
      };

      transaction.update(appealRef, appealUpdate);

      if (decision === 'overturn') {
        transaction.update(resourceRef, {
          status: 'draft',
          moderationStatus: 'appeal_overturned',
          appealStatus,
          moderationReason: {
            ...(resource.moderationReason ?? {}),
            appealOverturnedAt: now,
            appealOverturnedBy: user.uid,
            appealId: id,
          },
          updatedAt: now,
        });
      } else {
        transaction.update(resourceRef, {
          moderationStatus: 'appeal_upheld',
          appealStatus,
          moderationReason: {
            ...(resource.moderationReason ?? {}),
            appealUpheldAt: now,
            appealUpheldBy: user.uid,
            appealId: id,
          },
          updatedAt: now,
        });
      }

      const auditRef = adminDb.collection('audit_logs').doc();
      transaction.set(auditRef, {
        actorId: user.uid,
        moderatorId: user.uid,
        action: decision === 'overturn' ? 'appeal.overturned' : 'appeal.upheld',
        resourceType,
        resourceId: appeal.resourceId,
        reason: note || null,
        before: { appealStatus: appeal.status, resourceStatus: resource.status },
        after: { appealStatus, resourceStatus: decision === 'overturn' ? 'draft' : resource.status },
        metadata: { appealId: id, originalDecisionId: appeal.originalDecisionId },
        timestamp: now,
      });

      return {
        submitterId: String(appeal.submitterId || ''),
        resourceTitle: String(appeal.resourceTitle || appeal.resourceId || 'submission'),
        resourceType,
        resourceId: String(appeal.resourceId || ''),
        status: appealStatus,
      };
    });

    if (result.submitterId) {
      await createNotification({
        userId: result.submitterId,
        type: decision === 'overturn' ? 'appeal.overturned' : 'appeal.upheld',
        title: decision === 'overturn' ? 'Appeal approved' : 'Appeal decision upheld',
        body:
          decision === 'overturn'
            ? `${result.resourceTitle} has been returned to draft so you can resubmit it.`
            : `${result.resourceTitle} remains rejected after appeal review.`,
        metadata: { appealId: id, resourceType: result.resourceType, resourceId: result.resourceId },
      });
    }

    return successResponse({ id, status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN';
    if (message === 'NOT_FOUND') return errorResponse(ApiErrors.NOT_FOUND.code, 'Appeal not found', ApiErrors.NOT_FOUND.status);
    if (message === 'RESOURCE_NOT_FOUND') return errorResponse(ApiErrors.NOT_FOUND.code, 'Original submission not found', ApiErrors.NOT_FOUND.status);
    if (message === 'ORIGINAL_REVIEWER') return errorResponse(ApiErrors.FORBIDDEN.code, 'Original rejecting moderator cannot review this appeal', ApiErrors.FORBIDDEN.status);
    if (message === 'INVALID_STATUS') return errorResponse(ApiErrors.BUSINESS_RULE_VIOLATION.code, 'Appeal is already finalized', 422);
    if (message === 'INVALID_RESOURCE') return errorResponse(ApiErrors.VALIDATION_ERROR.code, 'Appeal resource is invalid', ApiErrors.VALIDATION_ERROR.status);
    console.error('Error deciding appeal:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to decide appeal', ApiErrors.INTERNAL_ERROR.status);
  }
});
