import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { withAuth } from '@/lib/api/withAuth';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';

// POST /api/v1/jobs/[id]/submit — Submit job for moderation
export const POST = withAuth(
  async (req: any, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const docRef = adminDb.collection('jobs').doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return errorResponse(ApiErrors.NOT_FOUND.code, 'Job not found', ApiErrors.NOT_FOUND.status);
      }

      const data = doc.data()!;

      if (data.ownerId !== req.user.uid) {
        return errorResponse(ApiErrors.FORBIDDEN.code, 'Must be owner to submit', ApiErrors.FORBIDDEN.status);
      }

      if (!['draft', 'rejected'].includes(data.status)) {
        return errorResponse(
          ApiErrors.BUSINESS_RULE_VIOLATION.code,
          'Only draft or rejected jobs can be submitted',
          ApiErrors.BUSINESS_RULE_VIOLATION.status
        );
      }

      await docRef.update({
        status: 'submitted',
        updatedAt: FieldValue.serverTimestamp(),
      });

      return successResponse({ id, status: 'submitted' });
    } catch (error) {
      console.error('Error submitting job:', error);
      return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to submit job', ApiErrors.INTERNAL_ERROR.status);
    }
  }
);
