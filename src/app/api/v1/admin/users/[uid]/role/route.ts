import * as admin from 'firebase-admin';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { AuthenticatedRequest } from '@/lib/api/withAuth';
import { withRole } from '@/lib/api/withRole';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { isAdminRole, serializeAdminData, writeAuditLog } from '@/lib/admin/server-utils';

type RouteParams = { params: Promise<{ uid: string }> };

async function handleRoleChange(req: AuthenticatedRequest, context: RouteParams) {
  const { uid } = await context.params;
  const actorId = req.user?.uid;
  if (!actorId) {
    return errorResponse(ApiErrors.UNAUTHENTICATED.code, 'Unauthenticated', ApiErrors.UNAUTHENTICATED.status);
  }
  let nextRole: unknown;
  let reason: string | null = null;

  try {
    const body = (await req.json()) as Record<string, unknown>;
    nextRole = body.role;
    reason = typeof body.reason === 'string' ? body.reason.trim() : null;
  } catch {
    return errorResponse(ApiErrors.VALIDATION_ERROR.code, 'Invalid JSON body', ApiErrors.VALIDATION_ERROR.status);
  }

  if (!isAdminRole(nextRole)) {
    return errorResponse(ApiErrors.VALIDATION_ERROR.code, 'Invalid role', ApiErrors.VALIDATION_ERROR.status, [
      { field: 'role', reason: 'Must be member, developer, moderator, or admin' },
    ]);
  }

  const userRef = adminDb.collection('users').doc(uid);
  let beforeData: FirebaseFirestore.DocumentData | null = null;

  try {
    await adminDb.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        throw new Error('USER_NOT_FOUND');
      }

      beforeData = userSnap.data() || {};
      const currentRole = beforeData.role || 'member';

      if (currentRole === 'admin' && nextRole !== 'admin') {
        const adminSnap = await tx.get(
          adminDb.collection('users').where('role', '==', 'admin').where('status', '==', 'active')
        );
        if (adminSnap.size <= 1) {
          throw new Error('LAST_ADMIN');
        }
      }

      tx.update(userRef, {
        role: nextRole,
        previousRole: currentRole,
        reconciliationPending: true,
        reconciliationTargetRole: nextRole,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      return errorResponse(ApiErrors.NOT_FOUND.code, 'User not found', ApiErrors.NOT_FOUND.status);
    }
    if (error instanceof Error && error.message === 'LAST_ADMIN') {
      return errorResponse(
        ApiErrors.BUSINESS_RULE_VIOLATION.code,
        'Cannot remove the last active admin',
        ApiErrors.BUSINESS_RULE_VIOLATION.status
      );
    }
    console.error('Role transaction failed:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to update user role', ApiErrors.INTERNAL_ERROR.status);
  }

  let authSynced = false;
  try {
    const authUser = await adminAuth.getUser(uid);
    await adminAuth.setCustomUserClaims(uid, {
      ...(authUser.customClaims || {}),
      role: nextRole,
    });
    authSynced = true;
  } catch (error) {
    console.error('Custom claims sync failed:', error);
  }

  if (authSynced) {
    await userRef.update({
      reconciliationPending: false,
      reconciliationTargetRole: admin.firestore.FieldValue.delete(),
      reconciledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  const afterSnap = await userRef.get();
  await writeAuditLog({
    actorId,
    action: authSynced ? 'admin.user.role_changed' : 'admin.user.role_change_pending_reconciliation',
    resourceType: 'user',
    resourceId: uid,
    before: beforeData,
    after: afterSnap.data() || null,
    reason,
    metadata: { authSynced },
  });

  if (!authSynced) {
    return errorResponse(
      ApiErrors.INTERNAL_ERROR.code,
      'Firestore role was updated, but custom claims sync is pending reconciliation',
      ApiErrors.INTERNAL_ERROR.status
    );
  }

  return successResponse({
    uid,
    role: nextRole,
    user: serializeAdminData({ id: afterSnap.id, ...afterSnap.data() }),
  });
}

export const POST = withRole('admin', handleRoleChange);
export const PATCH = withRole('admin', handleRoleChange);
