import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { withAuth, AuthenticatedRequest } from '@/lib/api/withAuth';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import * as admin from 'firebase-admin';

/**
 * DELETE /api/v1/api-keys/[id]
 * Revokes an API key by setting its status to 'revoked'.
 * Only the key owner can revoke their own keys.
 */
export const DELETE = withAuth(async (req: AuthenticatedRequest, context: any) => {
  try {
    const { id } = await context.params;

    if (!id || typeof id !== 'string') {
      return errorResponse(
        ApiErrors.VALIDATION_ERROR.code,
        'Invalid key ID',
        ApiErrors.VALIDATION_ERROR.status
      );
    }

    const ownerId = req.user!.uid;
    const docRef = adminDb.collection('api_keys').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return errorResponse(
        ApiErrors.NOT_FOUND.code,
        'API key not found',
        ApiErrors.NOT_FOUND.status
      );
    }

    const keyData = docSnap.data()!;

    // Verify ownership
    if (keyData.ownerId !== ownerId) {
      return errorResponse(
        ApiErrors.FORBIDDEN.code,
        'You can only revoke your own API keys',
        ApiErrors.FORBIDDEN.status
      );
    }

    if (keyData.status === 'revoked') {
      return errorResponse(
        ApiErrors.BUSINESS_RULE_VIOLATION.code,
        'API key is already revoked',
        ApiErrors.BUSINESS_RULE_VIOLATION.status
      );
    }

    await docRef.update({
      status: 'revoked',
      revokedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return successResponse({ id, status: 'revoked' });
  } catch (error) {
    console.error('Error revoking API key:', error);
    return errorResponse(
      ApiErrors.INTERNAL_ERROR.code,
      'Failed to revoke API key',
      ApiErrors.INTERNAL_ERROR.status
    );
  }
});
