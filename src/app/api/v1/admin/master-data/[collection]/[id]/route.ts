import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import type { AuthenticatedRequest } from '@/lib/api/withAuth';
import { withRole } from '@/lib/api/withRole';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { getMasterDataCollectionName } from '@/lib/admin/master-data';
import { serializeAdminData, writeAuditLog } from '@/lib/admin/server-utils';

async function isUniqueExcept(collectionName: string, field: 'slug' | 'code', value: unknown, id: string) {
  if (!value || typeof value !== 'string') return true;
  const snap = await adminDb.collection(collectionName).where(field, '==', value).limit(2).get();
  return snap.docs.every((doc) => doc.id === id);
}

type ItemParams = { params: Promise<{ collection: string; id: string }> };

export const PATCH = withRole('admin', async (req: AuthenticatedRequest, context: ItemParams) => {
  try {
    const { collection, id } = await context.params;
    const actorId = req.user?.uid;
    if (!actorId) {
      return errorResponse(ApiErrors.UNAUTHENTICATED.code, 'Unauthenticated', ApiErrors.UNAUTHENTICATED.status);
    }
    const collectionName = getMasterDataCollectionName(collection);

    if (!collectionName) {
      return errorResponse(ApiErrors.NOT_FOUND.code, 'Unknown master data collection', ApiErrors.NOT_FOUND.status);
    }

    const body = (await req.json()) as Record<string, unknown>;
    const expectedVersion = Number(body.version);
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
      return errorResponse(ApiErrors.VALIDATION_ERROR.code, 'version is required', ApiErrors.VALIDATION_ERROR.status);
    }

    const [slugUnique, codeUnique] = await Promise.all([
      isUniqueExcept(collectionName, 'slug', body.slug, id),
      isUniqueExcept(collectionName, 'code', body.code, id),
    ]);

    if (!slugUnique || !codeUnique) {
      return errorResponse(ApiErrors.CONFLICT.code, 'Slug or code already exists', ApiErrors.CONFLICT.status);
    }

    const ref = adminDb.collection(collectionName).doc(id);
    let beforeData: FirebaseFirestore.DocumentData | null = null;

    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error('NOT_FOUND');

      beforeData = snap.data() || {};
      if (Number(beforeData.version || 1) !== expectedVersion) {
        throw new Error('VERSION_MISMATCH');
      }

      const updateData = { ...body };
      delete updateData.id;
      delete updateData.version;

      if (body.action === 'merge') {
        updateData.isActive = false;
        updateData.mergedInto = body.mergedInto;
        updateData.mergedAt = admin.firestore.FieldValue.serverTimestamp();
      }

      tx.update(ref, {
        ...updateData,
        version: expectedVersion + 1,
        updatedBy: actorId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    const after = await ref.get();
    await writeAuditLog({
      actorId,
      action: body.action === 'merge' ? 'admin.master_data.merged' : 'admin.master_data.updated',
      resourceType: collectionName,
      resourceId: id,
      before: beforeData,
      after: after.data() || null,
      reason: typeof body.reason === 'string' ? body.reason : null,
    });

    return successResponse({ item: serializeAdminData({ id: after.id, ...after.data() }) });
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return errorResponse(ApiErrors.NOT_FOUND.code, 'Item not found', ApiErrors.NOT_FOUND.status);
    }
    if (error instanceof Error && error.message === 'VERSION_MISMATCH') {
      return errorResponse(
        ApiErrors.PRECONDITION_FAILED.code,
        'Version mismatch. Refresh and try again.',
        ApiErrors.PRECONDITION_FAILED.status
      );
    }
    console.error('Failed to update master data:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to update master data', ApiErrors.INTERNAL_ERROR.status);
  }
});
