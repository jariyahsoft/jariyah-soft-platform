import { adminDb } from '@/lib/firebase/admin';
import { withAuth } from '@/lib/api/withAuth';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import * as admin from 'firebase-admin';

// POST /api/v1/articles/[id]/submit
export const POST = withAuth(async (req: any, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const docRef = adminDb.collection('articles').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return errorResponse(ApiErrors.NOT_FOUND.code, 'Article not found', ApiErrors.NOT_FOUND.status);
    }

    const data = docSnap.data();

    if (data?.authorId !== req.user.uid) {
      return errorResponse(ApiErrors.FORBIDDEN.code, 'Must be author to submit', ApiErrors.FORBIDDEN.status);
    }

    if (data?.status !== 'draft' && data?.status !== 'rejected') {
      return errorResponse(
        ApiErrors.BUSINESS_RULE_VIOLATION.code,
        'Can only submit draft or rejected articles',
        ApiErrors.BUSINESS_RULE_VIOLATION.status
      );
    }

    await docRef.update({
      status: 'pending',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const updatedSnap = await docRef.get();
    return successResponse({ id: updatedSnap.id, ...updatedSnap.data() });
  } catch (error) {
    console.error('Error submitting article:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to submit article', ApiErrors.INTERNAL_ERROR.status);
  }
});
