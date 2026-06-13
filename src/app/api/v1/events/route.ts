import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { withApiKey } from '@/lib/api/withApiKey';
import { withRole } from '@/lib/api/withRole';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { paginationSchema } from '@/lib/validators/shared';
import { createEventSchema, EventData } from '@/lib/validators/event';

// GET /api/v1/events — List public events
export const GET = withApiKey(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    const parsedPagination = paginationSchema.safeParse({
      limit: searchParams.get('limit') || undefined,
      cursor: searchParams.get('cursor') || undefined,
    });

    if (!parsedPagination.success) {
      return errorResponse(
        ApiErrors.VALIDATION_ERROR.code,
        ApiErrors.VALIDATION_ERROR.message,
        ApiErrors.VALIDATION_ERROR.status,
        parsedPagination.error.issues.map((e) => ({ field: e.path.join('.'), reason: e.message }))
      );
    }

    let query: FirebaseFirestore.Query = adminDb
      .collection('events')
      .where('status', '==', 'active')
      .orderBy('startDate', 'asc');

    const type = searchParams.get('type');
    if (type) {
      query = query.where('type', '==', type);
    }

    query = query.limit(parsedPagination.data.limit);

    if (parsedPagination.data.cursor) {
      const cursorDoc = await adminDb.collection('events').doc(parsedPagination.data.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const data: EventData[] = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        ...d,
        id: doc.id,
        startDate: d.startDate.toDate().toISOString(),
        endDate: d.endDate.toDate().toISOString(),
        registrationDeadline: d.registrationDeadline.toDate().toISOString(),
        createdAt: d.createdAt?.toDate?.()?.toISOString() || d.createdAt,
        updatedAt: d.updatedAt?.toDate?.()?.toISOString() || d.updatedAt,
      } as EventData;
    });

    const lastDoc = snapshot.docs.at(-1);
    const nextCursor = snapshot.docs.length === parsedPagination.data.limit && lastDoc ? lastDoc.id : null;

    return successResponse(data, { nextCursor });
  } catch (error) {
    console.error('Error fetching events:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to fetch events', ApiErrors.INTERNAL_ERROR.status);
  }
});

// POST /api/v1/events — Create a new event (Developer+)
export const POST = withRole('developer', async (req: any) => {
  try {
    const body = await req.json();
    const parsed = createEventSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        ApiErrors.VALIDATION_ERROR.code,
        ApiErrors.VALIDATION_ERROR.message,
        ApiErrors.VALIDATION_ERROR.status,
        parsed.error.issues.map((e: any) => ({ field: e.path.join('.'), reason: e.message }))
      );
    }

    const uid = req.user.uid;
    const eventRef = adminDb.collection('events').doc();
    const now = FieldValue.serverTimestamp();

    const eventData = {
      title: parsed.data.title,
      description: parsed.data.description,
      type: parsed.data.type,
      status: 'active',
      venueType: parsed.data.venueType,
      venueDetails: parsed.data.venueDetails,
      startDate: Timestamp.fromDate(new Date(parsed.data.startDate)),
      endDate: Timestamp.fromDate(new Date(parsed.data.endDate)),
      capacity: parsed.data.capacity,
      registrationCount: 0,
      registrationDeadline: Timestamp.fromDate(new Date(parsed.data.registrationDeadline)),
      organizerId: uid,
      createdAt: now,
      updatedAt: now,
    };

    await eventRef.set(eventData);

    return successResponse({ id: eventRef.id }, {}, 201);
  } catch (error) {
    console.error('Error creating event:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to create event', ApiErrors.INTERNAL_ERROR.status);
  }
});
