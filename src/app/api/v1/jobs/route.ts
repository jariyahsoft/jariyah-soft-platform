import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { withApiKey } from '@/lib/api/withApiKey';
import { withRole } from '@/lib/api/withRole';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { paginationSchema } from '@/lib/validators/shared';
import { createJobSchema } from '@/lib/validators/job';

// GET /api/v1/jobs — List active, non-expired jobs
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

    const { limit, cursor } = parsedPagination.data;
    const now = Timestamp.now();

    const jobType = searchParams.get('jobType');
    const workMode = searchParams.get('workMode');
    const skill = searchParams.get('skill');

    let query: FirebaseFirestore.Query = adminDb
      .collection('jobs')
      .where('status', '==', 'published')
      .where('expiresAt', '>', now)
      .orderBy('expiresAt', 'asc')
      .orderBy('publishedAt', 'desc');

    // Note: Firestore only supports one inequality filter per query path; for combined filters,
    // we build a fresh query with all conditions
    if (jobType) {
      query = adminDb
        .collection('jobs')
        .where('status', '==', 'published')
        .where('expiresAt', '>', now)
        .where('jobType', '==', jobType)
        .orderBy('expiresAt', 'asc')
        .orderBy('publishedAt', 'desc');
    } else if (workMode) {
      query = adminDb
        .collection('jobs')
        .where('status', '==', 'published')
        .where('expiresAt', '>', now)
        .where('workMode', '==', workMode)
        .orderBy('expiresAt', 'asc')
        .orderBy('publishedAt', 'desc');
    } else if (skill) {
      query = adminDb
        .collection('jobs')
        .where('status', '==', 'published')
        .where('expiresAt', '>', now)
        .where('skills', 'array-contains', skill)
        .orderBy('expiresAt', 'asc')
        .orderBy('publishedAt', 'desc');
    }

    query = query.limit(limit);

    if (cursor) {
      const cursorDoc = await adminDb.collection('jobs').doc(cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }

    const snapshot = await query.get();

    const data = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        ...d,
        id: doc.id,
        expiresAt: d.expiresAt?.toDate?.()?.toISOString() ?? d.expiresAt,
        publishedAt: d.publishedAt?.toDate?.()?.toISOString() ?? d.publishedAt,
        createdAt: d.createdAt?.toDate?.()?.toISOString() ?? d.createdAt,
        updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? d.updatedAt,
      };
    });

    const lastDoc = snapshot.docs.at(-1);
    const nextCursor = snapshot.docs.length === limit && lastDoc ? lastDoc.id : null;

    return successResponse(data, { nextCursor });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to fetch jobs', ApiErrors.INTERNAL_ERROR.status);
  }
});

// POST /api/v1/jobs — Create job draft (Developer+)
export const POST = withRole('developer', async (req: any) => {
  try {
    const body = await req.json();
    const parsed = createJobSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        ApiErrors.VALIDATION_ERROR.code,
        ApiErrors.VALIDATION_ERROR.message,
        ApiErrors.VALIDATION_ERROR.status,
        parsed.error.issues.map((e: any) => ({ field: e.path.join('.'), reason: e.message }))
      );
    }

    const uid = req.user.uid;
    const now = FieldValue.serverTimestamp();
    const jobRef = adminDb.collection('jobs').doc();

    const jobData = {
      ownerId: uid,
      organization: parsed.data.organization,
      title: parsed.data.title,
      description: parsed.data.description,
      jobType: parsed.data.jobType,
      workMode: parsed.data.workMode,
      location: parsed.data.location ?? null,
      skills: parsed.data.skills,
      applicationURL: parsed.data.applicationURL,
      salaryRange: parsed.data.salaryRange ?? null,
      expiresAt: Timestamp.fromDate(new Date(parsed.data.expiresAt)),
      status: 'draft',
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await jobRef.set(jobData);

    return successResponse({ id: jobRef.id }, {}, 201);
  } catch (error) {
    console.error('Error creating job:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to create job', ApiErrors.INTERNAL_ERROR.status);
  }
});
