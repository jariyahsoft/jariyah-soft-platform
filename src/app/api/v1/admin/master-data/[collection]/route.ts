import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import type { AuthenticatedRequest } from '@/lib/api/withAuth';
import { withRole } from '@/lib/api/withRole';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { serializeAdminData, writeAuditLog } from '@/lib/admin/server-utils';
import { getMasterDataCollectionName } from '@/lib/admin/master-data';

async function assertUnique(collectionName: string, field: 'slug' | 'code', value: unknown) {
  if (!value || typeof value !== 'string') return true;
  const snap = await adminDb.collection(collectionName).where(field, '==', value).limit(1).get();
  return snap.empty;
}

export const GET = withRole('admin', async (_req, context) => {
  try {
    const { collection } = await context.params;
    const collectionName = getMasterDataCollectionName(collection);

    if (!collectionName) {
      return errorResponse(ApiErrors.NOT_FOUND.code, 'Unknown master data collection', ApiErrors.NOT_FOUND.status);
    }

    const snap = await adminDb.collection(collectionName).limit(200).get();
    const items: Array<Record<string, unknown> & { id: string }> = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    items.sort((a, b) =>
      String(a.name || a.code || a.slug || '').localeCompare(String(b.name || b.code || b.slug || ''))
    );

    return successResponse({ items: serializeAdminData(items), collection: collectionName });
  } catch (error) {
    console.error('Failed to load master data:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to load master data', ApiErrors.INTERNAL_ERROR.status);
  }
});

type CollectionParams = { params: Promise<{ collection: string }> };

export const POST = withRole('admin', async (req: AuthenticatedRequest, context: CollectionParams) => {
  try {
    const { collection } = await context.params;
    const actorId = req.user?.uid;
    if (!actorId) {
      return errorResponse(ApiErrors.UNAUTHENTICATED.code, 'Unauthenticated', ApiErrors.UNAUTHENTICATED.status);
    }
    const collectionName = getMasterDataCollectionName(collection);

    if (!collectionName) {
      return errorResponse(ApiErrors.NOT_FOUND.code, 'Unknown master data collection', ApiErrors.NOT_FOUND.status);
    }

    const body = (await req.json()) as Record<string, unknown>;
    const now = admin.firestore.FieldValue.serverTimestamp();

    const [slugUnique, codeUnique] = await Promise.all([
      assertUnique(collectionName, 'slug', body.slug),
      assertUnique(collectionName, 'code', body.code),
    ]);

    if (!slugUnique || !codeUnique) {
      return errorResponse(ApiErrors.CONFLICT.code, 'Slug or code already exists', ApiErrors.CONFLICT.status);
    }

    const ref = await adminDb.collection(collectionName).add({
      ...body,
      isActive: body.isActive !== false,
      version: 1,
      createdBy: actorId,
      updatedBy: actorId,
      createdAt: now,
      updatedAt: now,
    });

    const created = await ref.get();
    await writeAuditLog({
      actorId,
      action: 'admin.master_data.created',
      resourceType: collectionName,
      resourceId: ref.id,
      after: created.data() || null,
    });

    return successResponse({ item: serializeAdminData({ id: ref.id, ...created.data() }) }, {}, 201);
  } catch (error) {
    console.error('Failed to create master data:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to create master data', ApiErrors.INTERNAL_ERROR.status);
  }
});
