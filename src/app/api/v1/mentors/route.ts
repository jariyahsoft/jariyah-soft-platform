import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { withApiKey } from '@/lib/api/withApiKey';
import { withRole } from '@/lib/api/withRole';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { mentorProfileSchema } from '@/lib/validators/incubator';

// GET /api/v1/mentors — List active mentors
export const GET = withApiKey(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const expertise = searchParams.get('expertise');
    const limitParam = parseInt(searchParams.get('limit') ?? '20', 10);
    const limit = Math.min(Math.max(limitParam, 1), 100);

    let query: FirebaseFirestore.Query = adminDb
      .collection('mentor_profiles')
      .where('status', '==', 'active')
      .where('availability', 'in', ['available', 'limited'])
      .limit(limit);

    if (expertise) {
      query = adminDb
        .collection('mentor_profiles')
        .where('status', '==', 'active')
        .where('expertise', 'array-contains', expertise)
        .limit(limit);
    }

    const snapshot = await query.get();

    const data = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        uid: doc.id,
        displayName: d.displayName ?? null,
        expertise: d.expertise ?? [],
        bio: d.bio ?? '',
        availability: d.availability,
        maxProjects: d.maxProjects ?? 3,
        activeProjectCount: d.activeProjectCount ?? 0,
        status: d.status,
        updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? d.updatedAt,
      };
    });

    return successResponse(data);
  } catch (error) {
    console.error('Error fetching mentors:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to fetch mentors', ApiErrors.INTERNAL_ERROR.status);
  }
});

// PUT /api/v1/mentors — Upsert own mentor profile (Developer+)
export const PUT = withRole('developer', async (req: any) => {
  try {
    const body = await req.json();
    const parsed = mentorProfileSchema.safeParse(body);

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

    // Get developer display name to denormalize
    const devDoc = await adminDb.collection('developers').doc(uid).get();
    const displayName = devDoc.data()?.displayName ?? null;

    const profileData = {
      displayName,
      expertise: parsed.data.expertise,
      bio: parsed.data.bio,
      availability: parsed.data.availability,
      maxProjects: parsed.data.maxProjects,
      status: 'active',
      updatedAt: now,
    };

    const docRef = adminDb.collection('mentor_profiles').doc(uid);
    const existing = await docRef.get();

    if (existing.exists) {
      await docRef.update(profileData);
    } else {
      await docRef.set({
        ...profileData,
        activeProjectCount: 0,
        createdAt: now,
      });
    }

    return successResponse({ uid, ...parsed.data });
  } catch (error) {
    console.error('Error upserting mentor profile:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to save mentor profile', ApiErrors.INTERNAL_ERROR.status);
  }
});
