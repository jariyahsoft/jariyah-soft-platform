import { adminDb } from '@/lib/firebase/admin';
import { withRole } from '@/lib/api/withRole';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import * as admin from 'firebase-admin';

// POST /api/v1/moderation/[type]/[id]/reject
export const POST = withRole('moderator', async (req: any, { params }: { params: Promise<{ type: string; id: string }> }) => {
  try {
    const { type, id } = await params;

    if (type !== 'software' && type !== 'articles') {
      return errorResponse(ApiErrors.VALIDATION_ERROR.code, 'Invalid type', ApiErrors.VALIDATION_ERROR.status);
    }

    const body = await req.json().catch(() => ({}));
    if (!body.reason || typeof body.reason !== 'string' || body.reason.trim() === '') {
      return errorResponse(ApiErrors.VALIDATION_ERROR.code, 'Rejection reason is required', ApiErrors.VALIDATION_ERROR.status, [
        { field: 'reason', reason: 'String is required' }
      ]);
    }

    const docRef = adminDb.collection(type).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return errorResponse(ApiErrors.NOT_FOUND.code, 'Document not found', ApiErrors.NOT_FOUND.status);
    }

    if (docSnap.data()?.status !== 'pending') {
      return errorResponse(ApiErrors.BUSINESS_RULE_VIOLATION.code, 'Document is not pending review', ApiErrors.BUSINESS_RULE_VIOLATION.status);
    }

    await docRef.update({
      status: 'rejected',
      rejectionReason: body.reason,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      moderatedBy: req.user.uid,
    });

    // In a real app, send a notification to the author

    return successResponse({ success: true, id, status: 'rejected' });
  } catch (error) {
    console.error('Error rejecting submission:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to reject submission', ApiErrors.INTERNAL_ERROR.status);
  }
});
