import { NextRequest } from 'next/server';
import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { withRole } from '@/lib/api/withRole';

/**
 * GET /api/v1/software/[id]/follow
 * Check if the current user follows this software item.
 */
export const GET = withRole('member', async (req: any, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const followId = `${req.user.uid}_software_${id}`;
    const snap = await adminDb.collection('follows').doc(followId).get();
    return successResponse({ following: snap.exists });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to check follow status', ApiErrors.INTERNAL_ERROR.status);
  }
});

/**
 * POST /api/v1/software/[id]/follow
 * Follow a software item (idempotent).
 * Deterministic doc ID: followerId_software_targetId
 */
export const POST = withRole('member', async (req: any, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const followId = `${req.user.uid}_software_${id}`;

    const softwareRef = adminDb.collection('software').doc(id);
    const followRef = adminDb.collection('follows').doc(followId);

    const created = await adminDb.runTransaction(async (tx) => {
      const [softwareSnap, followSnap] = await Promise.all([
        tx.get(softwareRef),
        tx.get(followRef),
      ]);

      if (!softwareSnap.exists) throw new Error('SOFTWARE_NOT_FOUND');

      // Idempotent — already following
      if (followSnap.exists) return false;

      const now = admin.firestore.FieldValue.serverTimestamp();
      tx.set(followRef, {
        followerId: req.user.uid,
        targetType: 'software',
        targetId: id,
        createdAt: now,
      });
      tx.update(softwareRef, {
        followerCount: admin.firestore.FieldValue.increment(1),
      });
      return true;
    });

    return successResponse({ following: true, created }, {}, created ? 201 : 200);
  } catch (error: any) {
    if (error.message === 'SOFTWARE_NOT_FOUND') {
      return errorResponse(ApiErrors.NOT_FOUND.code, 'Software not found', ApiErrors.NOT_FOUND.status);
    }
    console.error('Error following software:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to follow', ApiErrors.INTERNAL_ERROR.status);
  }
});

/**
 * DELETE /api/v1/software/[id]/follow
 * Unfollow a software item.
 */
export const DELETE = withRole('member', async (req: any, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const followId = `${req.user.uid}_software_${id}`;

    const softwareRef = adminDb.collection('software').doc(id);
    const followRef = adminDb.collection('follows').doc(followId);

    await adminDb.runTransaction(async (tx) => {
      const [softwareSnap, followSnap] = await Promise.all([
        tx.get(softwareRef),
        tx.get(followRef),
      ]);

      if (!softwareSnap.exists) throw new Error('SOFTWARE_NOT_FOUND');

      // Already not following — idempotent
      if (!followSnap.exists) return;

      tx.delete(followRef);
      tx.update(softwareRef, {
        followerCount: admin.firestore.FieldValue.increment(-1),
      });
    });

    return successResponse({ following: false });
  } catch (error: any) {
    if (error.message === 'SOFTWARE_NOT_FOUND') {
      return errorResponse(ApiErrors.NOT_FOUND.code, 'Software not found', ApiErrors.NOT_FOUND.status);
    }
    console.error('Error unfollowing software:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to unfollow', ApiErrors.INTERNAL_ERROR.status);
  }
});
