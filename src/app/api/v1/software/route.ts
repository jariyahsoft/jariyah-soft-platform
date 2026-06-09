import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { withApiKey } from '@/lib/api/withApiKey';
import { withRole } from '@/lib/api/withRole';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { withIdempotency } from '@/lib/api/withIdempotency';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { softwareDraftSchema } from '@/lib/validators/software';
import { paginationSchema } from '@/lib/validators/shared';
import * as admin from 'firebase-admin';

// GET /api/v1/software
export const GET = withApiKey(async (req: NextRequest) => {
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
        parsedPagination.error.errors.map((e) => ({ field: e.path.join('.'), reason: e.message }))
      );
    }

    let query: admin.firestore.Query = adminDb.collection('software').where('status', '==', 'published');
    
    // Sort logic (assuming createdAt is standard)
    query = query.orderBy('createdAt', 'desc').limit(parsedPagination.data.limit);

    if (parsedPagination.data.cursor) {
      // In a real app we'd load the document snapshot by cursor string or use startAfter
      // Mock cursor logic here for illustration
    }

    const snapshot = await query.get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const nextCursor = snapshot.docs.length === parsedPagination.data.limit 
      ? snapshot.docs[snapshot.docs.length - 1].id 
      : null;

    return successResponse(data, { nextCursor });
  } catch (error) {
    console.error('Error fetching software:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to fetch software', ApiErrors.INTERNAL_ERROR.status);
  }
});

// POST /api/v1/software
export const POST = withRateLimit({ max: 10, windowMs: 60000 }, 
  withIdempotency(
    withRole('developer', async (req: any) => {
      try {
        const body = await req.json();
        const parsed = softwareDraftSchema.safeParse(body);
        
        if (!parsed.success) {
          return errorResponse(
            ApiErrors.VALIDATION_ERROR.code,
            ApiErrors.VALIDATION_ERROR.message,
            ApiErrors.VALIDATION_ERROR.status,
            parsed.error.errors.map((e) => ({ field: e.path.join('.'), reason: e.message }))
          );
        }

        const softwareData = {
          ...parsed.data,
          ownerId: req.user.uid,
          status: 'draft',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await adminDb.collection('software').add(softwareData);
        const docSnap = await docRef.get();

        return successResponse({ id: docRef.id, ...docSnap.data() }, {}, 201);
      } catch (error) {
        console.error('Error creating software draft:', error);
        return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to create software draft', ApiErrors.INTERNAL_ERROR.status);
      }
    })
  )
);
