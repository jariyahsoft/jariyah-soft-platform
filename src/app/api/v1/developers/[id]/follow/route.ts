import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { withRole } from '@/lib/api/withRole';

/**
 * GET /api/v1/developers/[id]/follow
 * Check if the current user follows this developer.
 */
export const GET = withRole('member', async (req: any, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const followId = `${req.user.uid}_developer_${id}`;
    const snap = await adminDb.collection('follows').doc(followId).get();
    return successResponse({ following: snap.exists });
  } catch (error) {
    console.error('Error checking developer follow status:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to check follow status', ApiErrors.INTERNAL_ERROR.status);
  }
});

/**
 * POST /api/v1/developers/[id]/follow
 * Follow a developer (idempotent).
 * Deterministic doc ID: followerId_developer_targetId
 */
export const POST = withRole('member', async (req: any, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const followId = `${req.user.uid}_developer_${id}`;

    const developerRef = adminDb.collection('developers').doc(id);
    const followRef = adminDb.collection('follows').doc(followId);

    const created = await adminDb.runTransaction(async (tx) => {
      const [developerSnap, followSnap] = await Promise.all([
        tx.get(developerRef),
        tx.get(followRef),
      ]);

      if (!developerSnap.exists) throw new Error('DEVELOPER_NOT_FOUND');

      if (followSnap.exists) return false;

      const now = admin.firestore.FieldValue.serverTimestamp();
      tx.set(followRef, {
        followerId: req.user.uid,
        targetType: 'developer',
        targetId: id,
        createdAt: now,
      });
      tx.update(developerRef, {
        followerCount: admin.firestore.FieldValue.increment(1),
      });
      return true;
    });

    return successResponse({ following: true, created }, {}, created ? 201 : 200);
  } catch (error: any) {
    if (error.message === 'DEVELOPER_NOT_FOUND') {
      return errorResponse(ApiErrors.NOT_FOUND.code, 'Developer not found', ApiErrors.NOT_FOUND.status);
    }
    console.error('Error following developer:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to follow', ApiErrors.INTERNAL_ERROR.status);
  }
});

/**
 * DELETE /api/v1/developers/[id]/follow
 * Unfollow a developer (idempotent).
 */
export const DELETE = withRole('member', async (req: any, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const followId = `${req.user.uid}_developer_${id}`;

    const developerRef = adminDb.collection('developers').doc(id);
    const followRef = adminDb.collection('follows').doc(followId);

    await adminDb.runTransaction(async (tx) => {
      const [developerSnap, followSnap] = await Promise.all([
        tx.get(developerRef),
        tx.get(followRef),
      ]);

      if (!developerSnap.exists) throw new Error('DEVELOPER_NOT_FOUND');
      if (!followSnap.exists) return;

      tx.delete(followRef);
      tx.update(developerRef, {
        followerCount: admin.firestore.FieldValue.increment(-1),
      });
    });

    return successResponse({ following: false });
  } catch (error: any) {
    if (error.message === 'DEVELOPER_NOT_FOUND') {
      return errorResponse(ApiErrors.NOT_FOUND.code, 'Developer not found', ApiErrors.NOT_FOUND.status);
    }
    console.error('Error unfollowing developer:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to unfollow', ApiErrors.INTERNAL_ERROR.status);
  }
});
