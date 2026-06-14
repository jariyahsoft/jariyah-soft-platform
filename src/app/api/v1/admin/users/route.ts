import { adminDb } from '@/lib/firebase/admin';
import { withRole } from '@/lib/api/withRole';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { serializeAdminData } from '@/lib/admin/server-utils';

const MAX_LIMIT = 100;

export const GET = withRole('admin', async (req) => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const rawLimit = Number.parseInt(searchParams.get('limit') || '25', 10);
    const limit = Math.min(Number.isFinite(rawLimit) ? rawLimit : 25, MAX_LIMIT);
    const searchType = searchParams.get('type') || 'name';
    const queryText = (searchParams.get('q') || '').trim();

    let users: Array<Record<string, unknown>> = [];

    if (queryText && searchType === 'uid') {
      const doc = await adminDb.collection('users').doc(queryText).get();
      users = doc.exists ? [{ id: doc.id, ...doc.data() }] : [];
    } else {
      let query: FirebaseFirestore.Query = adminDb.collection('users');

      if (queryText && searchType === 'email') {
        query = query.where('email', '==', queryText.toLowerCase());
      } else if (queryText) {
        query = query
          .orderBy('displayName')
          .startAt(queryText)
          .endAt(`${queryText}\uf8ff`);
      } else {
        query = query.orderBy('createdAt', 'desc');
      }

      const snapshot = await query.limit(limit).get();
      users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }

    return successResponse({
      items: serializeAdminData(users),
      totalCount: users.length,
    });
  } catch (error) {
    console.error('Error searching admin users:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to search users', ApiErrors.INTERNAL_ERROR.status);
  }
});
