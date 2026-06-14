import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { withApiKey } from '@/lib/api/withApiKey';
import { withAuth } from '@/lib/api/withAuth';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { editIncubatorSchema } from '@/lib/validators/incubator';

function serializeProject(doc: FirebaseFirestore.DocumentSnapshot) {
  const d = doc.data()!;
  return {
    ...d,
    id: doc.id,
    createdAt: d.createdAt?.toDate?.()?.toISOString() ?? d.createdAt,
    updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? d.updatedAt,
  };
}

// GET /api/v1/incubator/[id]
export const GET = withApiKey(
  async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const doc = await adminDb.collection('incubator_projects').doc(id).get();

      if (!doc.exists) {
        return errorResponse(ApiErrors.NOT_FOUND.code, 'Project not found', ApiErrors.NOT_FOUND.status);
      }

      const data = doc.data()!;
      if (data.status !== 'published') {
        return errorResponse(ApiErrors.NOT_FOUND.code, 'Project not found', ApiErrors.NOT_FOUND.status);
      }

      return successResponse(serializeProject(doc));
    } catch (error) {
      console.error('Error fetching incubator project:', error);
      return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to fetch project', ApiErrors.INTERNAL_ERROR.status);
    }
  }
);

// PATCH /api/v1/incubator/[id]
export const PATCH = withAuth(
  async (req: any, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const docRef = adminDb.collection('incubator_projects').doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return errorResponse(ApiErrors.NOT_FOUND.code, 'Project not found', ApiErrors.NOT_FOUND.status);
      }

      const data = doc.data()!;

      if (data.ownerId !== req.user.uid) {
        return errorResponse(ApiErrors.FORBIDDEN.code, 'Must be owner to edit', ApiErrors.FORBIDDEN.status);
      }

      if (!['draft', 'rejected'].includes(data.status)) {
        return errorResponse(
          ApiErrors.BUSINESS_RULE_VIOLATION.code,
          'Can only edit draft or rejected projects',
          ApiErrors.BUSINESS_RULE_VIOLATION.status
        );
      }

      const body = await req.json();
      const parsed = editIncubatorSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse(
          ApiErrors.VALIDATION_ERROR.code,
          ApiErrors.VALIDATION_ERROR.message,
          ApiErrors.VALIDATION_ERROR.status,
          parsed.error.issues.map((e: any) => ({ field: e.path.join('.'), reason: e.message }))
        );
      }

      await docRef.update({
        ...parsed.data,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const updated = await docRef.get();
      return successResponse(serializeProject(updated));
    } catch (error) {
      console.error('Error updating incubator project:', error);
      return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to update project', ApiErrors.INTERNAL_ERROR.status);
    }
  }
);
