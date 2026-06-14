import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import type { AuthenticatedRequest } from '@/lib/api/withAuth';
import { withRole } from '@/lib/api/withRole';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { createNotification, writeAuditLog } from '@/lib/admin/server-utils';

type BadgeParams = { params: Promise<{ id: string }> };

export const POST = withRole('admin', async (req: AuthenticatedRequest, context: BadgeParams) => {
  try {
    const { id } = await context.params;
    const actorId = req.user?.uid;
    if (!actorId) {
      return errorResponse(ApiErrors.UNAUTHENTICATED.code, 'Unauthenticated', ApiErrors.UNAUTHENTICATED.status);
    }
    const body = (await req.json()) as Record<string, unknown>;
    const uid = typeof body.uid === 'string' ? body.uid.trim() : '';

    if (!uid) {
      return errorResponse(ApiErrors.VALIDATION_ERROR.code, 'uid is required', ApiErrors.VALIDATION_ERROR.status);
    }

    const [badgeSnap, userSnap] = await Promise.all([
      adminDb.collection('badges').doc(id).get(),
      adminDb.collection('users').doc(uid).get(),
    ]);

    if (!badgeSnap.exists) {
      return errorResponse(ApiErrors.NOT_FOUND.code, 'Badge not found', ApiErrors.NOT_FOUND.status);
    }
    if (!userSnap.exists) {
      return errorResponse(ApiErrors.NOT_FOUND.code, 'User not found', ApiErrors.NOT_FOUND.status);
    }

    const awardRef = adminDb.collection('developer_badges').doc(`${uid}_${id}`);
    await awardRef.set(
      {
        userId: uid,
        developerId: uid,
        badgeId: id,
        awardedBy: actorId,
        reason: typeof body.reason === 'string' ? body.reason : null,
        awardedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await createNotification({
      userId: uid,
      type: 'badge.awarded',
      title: 'Badge awarded',
      body: `You received the ${badgeSnap.data()?.name || id} badge.`,
      metadata: { badgeId: id },
    });

    await writeAuditLog({
      actorId,
      action: 'admin.badge.awarded',
      resourceType: 'badge',
      resourceId: id,
      after: { userId: uid, badgeId: id },
      reason: typeof body.reason === 'string' ? body.reason : null,
    });

    return successResponse({ awardId: awardRef.id, userId: uid, badgeId: id }, {}, 201);
  } catch (error) {
    console.error('Failed to award badge:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to award badge', ApiErrors.INTERNAL_ERROR.status);
  }
});
