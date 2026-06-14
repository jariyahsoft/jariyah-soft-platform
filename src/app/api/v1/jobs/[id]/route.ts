import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { withApiKey } from '@/lib/api/withApiKey';
import { withAuth } from '@/lib/api/withAuth';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { editJobSchema } from '@/lib/validators/job';

function serializeJob(doc: FirebaseFirestore.DocumentSnapshot) {
  const d = doc.data()!;
  return {
    ...d,
    id: doc.id,
    expiresAt: d.expiresAt?.toDate?.()?.toISOString() ?? d.expiresAt,
    publishedAt: d.publishedAt?.toDate?.()?.toISOString() ?? d.publishedAt ?? null,
    createdAt: d.createdAt?.toDate?.()?.toISOString() ?? d.createdAt,
    updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? d.updatedAt,
  };
}

// GET /api/v1/jobs/[id]
export const GET = withApiKey(
  async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const doc = await adminDb.collection('jobs').doc(id).get();

      if (!doc.exists) {
        return errorResponse(ApiErrors.NOT_FOUND.code, 'Job not found', ApiErrors.NOT_FOUND.status);
      }

      const data = doc.data()!;
      if (data.status !== 'published') {
        return errorResponse(ApiErrors.NOT_FOUND.code, 'Job not found', ApiErrors.NOT_FOUND.status);
      }

      // Check not expired
      const expiresAt = data.expiresAt?.toDate?.() ?? new Date(data.expiresAt);
      if (expiresAt < new Date()) {
        return errorResponse(ApiErrors.NOT_FOUND.code, 'Job has expired', ApiErrors.NOT_FOUND.status);
      }

      return successResponse(serializeJob(doc));
    } catch (error) {
      console.error('Error fetching job:', error);
      return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to fetch job', ApiErrors.INTERNAL_ERROR.status);
    }
  }
);

// PATCH /api/v1/jobs/[id]
export const PATCH = withAuth(
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
        return errorResponse(ApiErrors.FORBIDDEN.code, 'Must be owner to edit', ApiErrors.FORBIDDEN.status);
      }

      if (!['draft', 'rejected'].includes(data.status)) {
        return errorResponse(
          ApiErrors.BUSINESS_RULE_VIOLATION.code,
          'Can only edit draft or rejected jobs',
          ApiErrors.BUSINESS_RULE_VIOLATION.status
        );
      }

      const body = await req.json();
      const parsed = editJobSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse(
          ApiErrors.VALIDATION_ERROR.code,
          ApiErrors.VALIDATION_ERROR.message,
          ApiErrors.VALIDATION_ERROR.status,
          parsed.error.issues.map((e: any) => ({ field: e.path.join('.'), reason: e.message }))
        );
      }

      const updateData: Record<string, unknown> = {
        ...parsed.data,
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Convert expiresAt to Timestamp if provided
      if (parsed.data.expiresAt) {
        const { Timestamp } = await import('firebase-admin/firestore');
        updateData.expiresAt = Timestamp.fromDate(new Date(parsed.data.expiresAt));
      }

      await docRef.update(updateData);
      const updated = await docRef.get();

      return successResponse(serializeJob(updated));
    } catch (error) {
      console.error('Error updating job:', error);
      return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to update job', ApiErrors.INTERNAL_ERROR.status);
    }
  }
);
