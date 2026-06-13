import { NextRequest } from 'next/server';
import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { withApiKey } from '@/lib/api/withApiKey';
import { withRole } from '@/lib/api/withRole';
import { reviewSchema } from '@/lib/validators/review';
import { getReviewBySoftwareAndUser, listApprovedReviewsForSoftware } from '@/lib/reviews/data';

function normalizeSort(sort: string | null): 'newest' | 'highest' | 'lowest' {
  if (sort === 'highest' || sort === 'lowest') return sort;
  return 'newest';
}

export const GET = withApiKey(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit') ?? 5);
    const page = Number(searchParams.get('page') ?? 1);
    const sort = normalizeSort(searchParams.get('sort'));
    const userId = searchParams.get('userId');

    const [reviews, existingReview] = await Promise.all([
      listApprovedReviewsForSoftware(id, { limit, page, sort }),
      userId ? getReviewBySoftwareAndUser(id, userId) : Promise.resolve(null),
    ]);

    return successResponse({
      items: reviews.items,
      hasMore: reviews.hasMore,
      existingReview,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to fetch reviews', ApiErrors.INTERNAL_ERROR.status);
  }
});

export const PUT = withRole('member', async (req: any, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        ApiErrors.VALIDATION_ERROR.code,
        ApiErrors.VALIDATION_ERROR.message,
        ApiErrors.VALIDATION_ERROR.status,
        parsed.error.issues.map((issue) => ({ field: issue.path.join('.'), reason: issue.message }))
      );
    }

    const softwareRef = adminDb.collection('software').doc(id);
    const userRef = adminDb.collection('users').doc(req.user.uid);
    const reviewRef = adminDb.collection('reviews').doc(`${id}_${req.user.uid}`);

    const result = await adminDb.runTransaction(async (transaction) => {
      const [softwareSnap, userSnap, existingReviewSnap] = await Promise.all([
        transaction.get(softwareRef),
        transaction.get(userRef),
        transaction.get(reviewRef),
      ]);

      if (!softwareSnap.exists) {
        throw new Error('SOFTWARE_NOT_FOUND');
      }

      const software = softwareSnap.data();
      if (software?.status !== 'published') {
        throw new Error('SOFTWARE_NOT_PUBLISHED');
      }

      if (software?.ownerId === req.user.uid) {
        throw new Error('SELF_REVIEW');
      }

      const now = admin.firestore.FieldValue.serverTimestamp();
      const userData = userSnap.data() ?? {};
      const reviewData = {
        softwareId: id,
        userId: req.user.uid,
        userName: userData.displayName ?? req.user.name ?? 'Community member',
        userAvatar: userData.photoURL ?? null,
        rating: parsed.data.rating,
        body: parsed.data.body,
        status: 'pending',
        moderationReason: admin.firestore.FieldValue.delete(),
        createdAt: existingReviewSnap.exists ? existingReviewSnap.data()?.createdAt ?? now : now,
        updatedAt: now,
      };

      transaction.set(reviewRef, reviewData, { merge: true });

      return {
        id: reviewRef.id,
        status: 'pending',
        updated: existingReviewSnap.exists,
      };
    });

    return successResponse(result, {}, result.updated ? 200 : 201);
  } catch (error: any) {
    console.error('Error upserting review:', error);
    if (error.message === 'SOFTWARE_NOT_FOUND') {
      return errorResponse(ApiErrors.NOT_FOUND.code, 'Software not found', ApiErrors.NOT_FOUND.status);
    }
    if (error.message === 'SOFTWARE_NOT_PUBLISHED') {
      return errorResponse(
        ApiErrors.BUSINESS_RULE_VIOLATION.code,
        'Software must be published before reviews are allowed',
        ApiErrors.BUSINESS_RULE_VIOLATION.status
      );
    }
    if (error.message === 'SELF_REVIEW') {
      return errorResponse(
        ApiErrors.BUSINESS_RULE_VIOLATION.code,
        'You cannot review your own software',
        ApiErrors.BUSINESS_RULE_VIOLATION.status
      );
    }
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to save review', ApiErrors.INTERNAL_ERROR.status);
  }
});
