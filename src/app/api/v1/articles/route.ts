import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { withRole } from '@/lib/api/withRole';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { withIdempotency } from '@/lib/api/withIdempotency';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { articleDraftSchema } from '@/lib/validators/article';
import { paginationSchema } from '@/lib/validators/shared';
import * as admin from 'firebase-admin';

// GET /api/v1/articles
export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const limitParams = {
      limit: searchParams.get('limit') || undefined,
      cursor: searchParams.get('cursor') || undefined,
    };

    const parsedPagination = paginationSchema.safeParse(limitParams);
    if (!parsedPagination.success) {
      return errorResponse(
        ApiErrors.VALIDATION_ERROR.code,
        ApiErrors.VALIDATION_ERROR.message,
        ApiErrors.VALIDATION_ERROR.status,
        parsedPagination.error.issues.map((e) => ({ field: e.path.join('.'), reason: e.message }))
      );
    }

    let query: admin.firestore.Query = adminDb.collection('articles').where('status', '==', 'published');
    query = query.orderBy('createdAt', 'desc').limit(parsedPagination.data.limit);

    const snapshot = await query.get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const lastDoc = snapshot.docs.at(-1);
    const nextCursor = snapshot.docs.length === parsedPagination.data.limit && lastDoc
      ? lastDoc.id
      : null;

    return successResponse(data, { nextCursor });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to fetch articles', ApiErrors.INTERNAL_ERROR.status);
  }
};

// POST /api/v1/articles
export const POST = withRateLimit({ max: 10, windowMs: 60000 }, 
  withIdempotency(
    withRole('developer', async (req: any) => {
      try {
        const body = await req.json();
        const parsed = articleDraftSchema.safeParse(body);
        
        if (!parsed.success) {
          return errorResponse(
            ApiErrors.VALIDATION_ERROR.code,
            ApiErrors.VALIDATION_ERROR.message,
            ApiErrors.VALIDATION_ERROR.status,
            parsed.error.issues.map((e) => ({ field: e.path.join('.'), reason: e.message }))
          );
        }

        const articleData = {
          ...parsed.data,
          authorId: req.user.uid,
          status: 'draft',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await adminDb.collection('articles').add(articleData);
        const docSnap = await docRef.get();

        return successResponse({ id: docRef.id, ...docSnap.data() }, {}, 201);
      } catch (error) {
        console.error('Error creating article draft:', error);
        return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to create article draft', ApiErrors.INTERNAL_ERROR.status);
      }
    })
  )
);
