import * as admin from 'firebase-admin';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { AuthenticatedRequest } from '@/lib/api/withAuth';
import { withRole } from '@/lib/api/withRole';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { createNotification, serializeAdminData, writeAuditLog } from '@/lib/admin/server-utils';

type StatusAction = 'suspend' | 'reactivate';
type RouteParams = { params: Promise<{ uid: string }> };

export const PATCH = withRole('admin', async (req: AuthenticatedRequest, context: RouteParams) => {
  const { uid } = await context.params;
  const actorId = req.user?.uid;
  if (!actorId) {
    return errorResponse(ApiErrors.UNAUTHENTICATED.code, 'Unauthenticated', ApiErrors.UNAUTHENTICATED.status);
  }

  if (uid === actorId) {
    return errorResponse(
      ApiErrors.BUSINESS_RULE_VIOLATION.code,
      'Admins cannot suspend or reactivate themselves',
      ApiErrors.BUSINESS_RULE_VIOLATION.status
    );
  }

  let action: StatusAction;
  let reason = '';
  let durationDays: number | null = null;

  try {
    const body = (await req.json()) as Record<string, unknown>;
    action = body.action as StatusAction;
    reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    durationDays = typeof body.durationDays === 'number' ? body.durationDays : null;
  } catch {
    return errorResponse(ApiErrors.VALIDATION_ERROR.code, 'Invalid JSON body', ApiErrors.VALIDATION_ERROR.status);
  }

  if (action !== 'suspend' && action !== 'reactivate') {
    return errorResponse(ApiErrors.VALIDATION_ERROR.code, 'Invalid status action', ApiErrors.VALIDATION_ERROR.status);
  }

  if (action === 'suspend' && reason.length < 5) {
    return errorResponse(ApiErrors.VALIDATION_ERROR.code, 'Suspend reason is required', ApiErrors.VALIDATION_ERROR.status, [
      { field: 'reason', reason: 'Must be at least 5 characters' },
    ]);
  }

  const userRef = adminDb.collection('users').doc(uid);
  const beforeSnap = await userRef.get();
  if (!beforeSnap.exists) {
    return errorResponse(ApiErrors.NOT_FOUND.code, 'User not found', ApiErrors.NOT_FOUND.status);
  }

  const beforeData = beforeSnap.data() || {};
  const now = admin.firestore.FieldValue.serverTimestamp();

  try {
    if (action === 'suspend') {
      const suspendedUntil =
        durationDays && durationDays > 0
          ? admin.firestore.Timestamp.fromDate(new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000))
          : null;

      await Promise.all([
        userRef.update({
          status: 'suspended',
          suspendedAt: now,
          suspendedUntil,
          suspendReason: reason,
          previousRoleBeforeSuspension: beforeData.role || 'member',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }),
        adminAuth.revokeRefreshTokens(uid),
      ]);

      await createNotification({
        userId: uid,
        type: 'account.suspended',
        title: 'Account suspended',
        body: reason,
        metadata: { durationDays },
      });
    } else {
      await userRef.update({
        status: 'active',
        suspendedAt: admin.firestore.FieldValue.delete(),
        suspendedUntil: admin.firestore.FieldValue.delete(),
        suspendReason: admin.firestore.FieldValue.delete(),
        previousRoleBeforeSuspension: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await createNotification({
        userId: uid,
        type: 'account.reactivated',
        title: 'Account reactivated',
        body: 'Your account has been reactivated.',
      });
    }

    const afterSnap = await userRef.get();
    await writeAuditLog({
      actorId,
      action: action === 'suspend' ? 'admin.user.suspended' : 'admin.user.reactivated',
      resourceType: 'user',
      resourceId: uid,
      before: beforeData,
      after: afterSnap.data() || null,
      reason: action === 'suspend' ? reason : null,
      metadata: { durationDays },
    });

    return successResponse({
      uid,
      status: action === 'suspend' ? 'suspended' : 'active',
      user: serializeAdminData({ id: afterSnap.id, ...afterSnap.data() }),
    });
  } catch (error) {
    console.error('Status update failed:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to update user status', ApiErrors.INTERNAL_ERROR.status);
  }
});
