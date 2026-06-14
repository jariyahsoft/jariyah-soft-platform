import * as admin from 'firebase-admin';
import type { AuthenticatedRequest } from '@/lib/api/withAuth';
import { withRole } from '@/lib/api/withRole';
import { ApiErrors, errorResponse, successResponse } from '@/lib/api/response';
import { adminDb } from '@/lib/firebase/admin';
import { createNotification, serializeAdminData, writeAuditLog } from '@/lib/admin/server-utils';
import {
  findLatestRejectionDecision,
  getAppealableResource,
  getResourceOwnerId,
  getResourceTitle,
  isAppealBlockedReason,
  isAppealableResourceType,
  isWithinAppealWindow,
  timestampToDate,
} from '@/lib/moderation/appeals';

function cleanAttachments(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

export const POST = withRole('developer', async (req: AuthenticatedRequest) => {
  try {
    const user = req.user;
    if (!user) {
      return errorResponse(ApiErrors.UNAUTHENTICATED.code, ApiErrors.UNAUTHENTICATED.message, ApiErrors.UNAUTHENTICATED.status);
    }

    const body = await req.json().catch(() => ({}));
    const resourceType = String(body.resourceType || '');
    const resourceId = String(body.resourceId || '').trim();
    const reason = String(body.reason || '').trim();
    const attachments = cleanAttachments(body.attachments);

    if (!isAppealableResourceType(resourceType) || !resourceId || reason.length < 20 || reason.length > 2000) {
      return errorResponse(
        ApiErrors.VALIDATION_ERROR.code,
        'resourceType, resourceId, and reason between 20 and 2000 characters are required',
        ApiErrors.VALIDATION_ERROR.status
      );
    }

    const { snap } = await getAppealableResource(resourceType, resourceId);
    if (!snap.exists) {
      return errorResponse(ApiErrors.NOT_FOUND.code, 'Original submission not found', ApiErrors.NOT_FOUND.status);
    }

    const resource = snap.data() ?? {};
    const ownerId = getResourceOwnerId(resourceType, resource);
    if (ownerId !== user.uid) {
      return errorResponse(ApiErrors.FORBIDDEN.code, 'You can only appeal your own submission', ApiErrors.FORBIDDEN.status);
    }

    if (resource.status !== 'rejected') {
      return errorResponse(ApiErrors.BUSINESS_RULE_VIOLATION.code, 'Only rejected submissions can be appealed', 422);
    }

    const moderationReason = resource.moderationReason ?? {};
    if (isAppealBlockedReason(moderationReason.reasonCode)) {
      return errorResponse(ApiErrors.BUSINESS_RULE_VIOLATION.code, 'This rejection reason is not eligible for appeal', 422);
    }

    const latestDecision = await findLatestRejectionDecision(resourceType, resourceId);
    const originalDecisionId = String(moderationReason.decisionId || latestDecision?.id || '').trim();
    if (!originalDecisionId) {
      return errorResponse(ApiErrors.BUSINESS_RULE_VIOLATION.code, 'Original moderation decision could not be found', 422);
    }

    const rejectedAt =
      timestampToDate(moderationReason.rejectedAt) ||
      timestampToDate((latestDecision as FirebaseFirestore.DocumentData | null)?.timestamp);
    if (!isWithinAppealWindow(rejectedAt)) {
      return errorResponse(ApiErrors.BUSINESS_RULE_VIOLATION.code, 'Appeals must be submitted within 14 days of rejection', 422);
    }

    const existingAppeal = await adminDb
      .collection('appeals')
      .where('originalDecisionId', '==', originalDecisionId)
      .where('submitterId', '==', user.uid)
      .limit(1)
      .get();

    if (!existingAppeal.empty) {
      return errorResponse(ApiErrors.CONFLICT.code, 'An appeal already exists for this decision', ApiErrors.CONFLICT.status);
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const appealRef = adminDb.collection('appeals').doc();
    const latestDecisionData = latestDecision as FirebaseFirestore.DocumentData | null;
    const originalModeratorId = String(moderationReason.rejectedBy || latestDecisionData?.actorId || latestDecisionData?.moderatorId || '');
    const appealData = {
      resourceType,
      resourceId,
      resourceTitle: getResourceTitle(resourceType, resource),
      submitterId: user.uid,
      originalDecisionId,
      originalModeratorId,
      rejectionReason: {
        reasonCode: moderationReason.reasonCode ?? null,
        note: moderationReason.note ?? resource.rejectionReason ?? null,
        rejectedAt: moderationReason.rejectedAt ?? latestDecisionData?.timestamp ?? null,
      },
      appealReason: reason,
      attachments,
      status: 'pending',
      escalated: false,
      createdAt: now,
      updatedAt: now,
    };

    await appealRef.set(appealData);
    await writeAuditLog({
      actorId: user.uid,
      action: 'appeal.submitted',
      resourceType,
      resourceId,
      after: { appealId: appealRef.id, status: 'pending' },
      metadata: { appealId: appealRef.id, originalDecisionId },
    });

    if (originalModeratorId) {
      await createNotification({
        userId: originalModeratorId,
        type: 'appeal.submitted',
        title: 'New appeal submitted',
        body: `${appealData.resourceTitle} has a developer appeal waiting for review.`,
        metadata: { appealId: appealRef.id, resourceType, resourceId },
      });
    }

    const serializedAppeal = serializeAdminData(appealData) as Record<string, unknown>;
    return successResponse({ id: appealRef.id, ...serializedAppeal }, {}, 201);
  } catch (error) {
    console.error('Error creating appeal:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to create appeal', ApiErrors.INTERNAL_ERROR.status);
  }
});
