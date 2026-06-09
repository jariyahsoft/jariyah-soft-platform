import { adminDb } from '@/lib/firebase/admin';
import { withAuth } from '@/lib/api/withAuth';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import * as admin from 'firebase-admin';

// POST /api/v1/software/[id]/submit
export const POST = withAuth(async (req: any, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const docRef = adminDb.collection('software').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return errorResponse(ApiErrors.NOT_FOUND.code, 'Software not found', ApiErrors.NOT_FOUND.status);
    }

    const data = docSnap.data();

    // Owner check
    if (data?.ownerId !== req.user.uid) {
      return errorResponse(ApiErrors.FORBIDDEN.code, 'Must be owner to submit', ApiErrors.FORBIDDEN.status);
    }

    // Status check
    if (data?.status !== 'draft' && data?.status !== 'rejected') {
      return errorResponse(
        ApiErrors.BUSINESS_RULE_VIOLATION.code,
        'Can only submit draft or rejected software',
        ApiErrors.BUSINESS_RULE_VIOLATION.status
      );
    }

    await docRef.update({
      status: 'pending', // pending review by moderator
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const updatedSnap = await docRef.get();
    return successResponse({ id: updatedSnap.id, ...updatedSnap.data() });
  } catch (error) {
    console.error('Error submitting software:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to submit software', ApiErrors.INTERNAL_ERROR.status);
  }
});
