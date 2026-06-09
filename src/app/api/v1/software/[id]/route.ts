import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { withApiKey } from '@/lib/api/withApiKey';
import { withAuth } from '@/lib/api/withAuth';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { softwareEditSchema } from '@/lib/validators/software';
import * as admin from 'firebase-admin';

// GET /api/v1/software/[id]
export const GET = withApiKey(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const docRef = adminDb.collection('software').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return errorResponse(ApiErrors.NOT_FOUND.code, 'Software not found', ApiErrors.NOT_FOUND.status);
    }

    const data = docSnap.data();
    
    // According to security rules, public can only read if published
    if (data?.status !== 'published') {
      return errorResponse(ApiErrors.FORBIDDEN.code, 'Software not published', ApiErrors.FORBIDDEN.status);
    }

    return successResponse({ id: docSnap.id, ...data });
  } catch (error) {
    console.error('Error fetching software detail:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to fetch software detail', ApiErrors.INTERNAL_ERROR.status);
  }
});

// PATCH /api/v1/software/[id]
export const PATCH = withAuth(async (req: any, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const ifMatch = req.headers.get('If-Match');
    if (!ifMatch) {
      return errorResponse(ApiErrors.PRECONDITION_FAILED.code, 'Missing If-Match header (ETag)', ApiErrors.PRECONDITION_FAILED.status);
    }

    const docRef = adminDb.collection('software').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return errorResponse(ApiErrors.NOT_FOUND.code, 'Software not found', ApiErrors.NOT_FOUND.status);
    }

    const data = docSnap.data();

    // Owner check
    if (data?.ownerId !== req.user.uid) {
      return errorResponse(ApiErrors.FORBIDDEN.code, 'Must be owner to edit', ApiErrors.FORBIDDEN.status);
    }

    // Status check
    if (data?.status !== 'draft' && data?.status !== 'rejected') {
      return errorResponse(ApiErrors.BUSINESS_RULE_VIOLATION.code, 'Can only edit draft or rejected software', ApiErrors.BUSINESS_RULE_VIOLATION.status);
    }

    // Check ETag (We'll use updatedAt timestamp as a simple ETag proxy)
    const currentETag = `"${data?.updatedAt?.toMillis()}"`;
    if (ifMatch !== currentETag && ifMatch !== '*') {
       return errorResponse(ApiErrors.PRECONDITION_FAILED.code, 'ETag mismatch', ApiErrors.PRECONDITION_FAILED.status);
    }

    const body = await req.json();
    const parsed = softwareEditSchema.safeParse(body);
    
    if (!parsed.success) {
      return errorResponse(
        ApiErrors.VALIDATION_ERROR.code,
        ApiErrors.VALIDATION_ERROR.message,
        ApiErrors.VALIDATION_ERROR.status,
        parsed.error.errors.map((e) => ({ field: e.path.join('.'), reason: e.message }))
      );
    }

    const updateData = {
      ...parsed.data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await docRef.update(updateData);
    const updatedSnap = await docRef.get();

    return successResponse({ id: updatedSnap.id, ...updatedSnap.data() });
  } catch (error) {
    console.error('Error updating software:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to update software', ApiErrors.INTERNAL_ERROR.status);
  }
});
