import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { withApiKey } from '@/lib/api/withApiKey';
import { withRole } from '@/lib/api/withRole';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { paginationSchema } from '@/lib/validators/shared';
import { createIncubatorSchema } from '@/lib/validators/incubator';

// GET /api/v1/incubator — List published projects
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
    const stage = searchParams.get('stage');
    const skill = searchParams.get('skill');

    let query: FirebaseFirestore.Query = adminDb
      .collection('incubator_projects')
      .where('status', '==', 'published')
      .orderBy('updatedAt', 'desc');

    if (stage) {
      query = adminDb
        .collection('incubator_projects')
        .where('status', '==', 'published')
        .where('stage', '==', stage)
        .orderBy('updatedAt', 'desc');
    } else if (skill) {
      query = adminDb
        .collection('incubator_projects')
        .where('status', '==', 'published')
        .where('skillNeeds', 'array-contains', skill)
        .orderBy('updatedAt', 'desc');
    }

    query = query.limit(limit);

    if (cursor) {
      const cursorDoc = await adminDb.collection('incubator_projects').doc(cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }

    const snapshot = await query.get();

    const data = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        ...d,
        id: doc.id,
        createdAt: d.createdAt?.toDate?.()?.toISOString() ?? d.createdAt,
        updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? d.updatedAt,
      };
    });

    const lastDoc = snapshot.docs.at(-1);
    const nextCursor = snapshot.docs.length === limit && lastDoc ? lastDoc.id : null;

    return successResponse(data, { nextCursor });
  } catch (error) {
    console.error('Error fetching incubator projects:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to fetch projects', ApiErrors.INTERNAL_ERROR.status);
  }
});

// POST /api/v1/incubator — Create incubator project (Developer+)
export const POST = withRole('developer', async (req: any) => {
  try {
    const body = await req.json();
    const parsed = createIncubatorSchema.safeParse(body);

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
    const projectRef = adminDb.collection('incubator_projects').doc();

    const projectData = {
      ownerId: uid,
      name: parsed.data.name,
      description: parsed.data.description,
      stage: parsed.data.stage,
      repositoryURL: parsed.data.repositoryURL ?? null,
      skillNeeds: parsed.data.skillNeeds,
      mentorIds: [],
      contributorIds: [],
      status: 'draft',
      searchSyncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    await projectRef.set(projectData);

    return successResponse({ id: projectRef.id }, {}, 201);
  } catch (error) {
    console.error('Error creating incubator project:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to create project', ApiErrors.INTERNAL_ERROR.status);
  }
});
