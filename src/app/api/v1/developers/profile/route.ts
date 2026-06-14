import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { withRole } from '@/lib/api/withRole';
import { AuthenticatedRequest } from '@/lib/api/withAuth';
import { developerProfileSchema } from '@/lib/validators/developer';
import { syncDeveloperToTypesense } from '@/lib/search/client';
import { fetchGithubProfile, normalizeGithubUsername } from '@/lib/github/profile';

export const PUT = withRole('developer', async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const parsed = developerProfileSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        ApiErrors.VALIDATION_ERROR.code,
        'Validation failed',
        ApiErrors.VALIDATION_ERROR.status,
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          reason: e.message,
        }))
      );
    }

    const {
      displayName,
      slug: proposedSlug,
      bio,
      skills,
      githubUsername,
      websiteURL,
      socialLinks,
      photoURL,
      coverURL,
    } = parsed.data;

    const uid = req.user!.uid;
    const normalizedGithubUsername = githubUsername ? normalizeGithubUsername(githubUsername) : null;
    let githubProfile = null;
    if (normalizedGithubUsername) {
      try {
        githubProfile = await fetchGithubProfile(normalizedGithubUsername);
      } catch (githubError) {
        console.warn('GitHub profile lookup failed, saving profile without stats:', githubError);
      }
    }

    // 1. Uniqueness check - verify proposedSlug is not taken by another user in 'developers'
    const slugQuery = await adminDb
      .collection('developers')
      .where('slug', '==', proposedSlug)
      .limit(1)
      .get();

    const slugMatch = slugQuery.docs[0];
    if (!slugQuery.empty && slugMatch?.id !== uid) {
      return errorResponse(
        ApiErrors.VALIDATION_ERROR.code,
        'Slug is already taken',
        ApiErrors.VALIDATION_ERROR.status,
        [{ field: 'slug', reason: 'This slug is already used by another developer' }]
      );
    }

    // 2. Uniqueness check - verify proposedSlug is not taken by another user's redirect mapping
    const redirectCheck = await adminDb
      .collection('developer_slug_redirects')
      .doc(proposedSlug)
      .get();

    const redirectData = redirectCheck.data();
    if (redirectCheck.exists && redirectData?.developerId !== uid) {
      return errorResponse(
        ApiErrors.VALIDATION_ERROR.code,
        'Slug is reserved',
        ApiErrors.VALIDATION_ERROR.status,
        [{ field: 'slug', reason: 'This slug is reserved due to a redirect mapping of another developer' }]
      );
    }

    const devRef = adminDb.collection('developers').doc(uid);
    const userRef = adminDb.collection('users').doc(uid);

    let verificationStatus = 'unverified';
    let reputationScore = 0;

    // Run Firestore transaction to update profile data and create redirect if necessary
    await adminDb.runTransaction(async (transaction) => {
      const [devSnap, userSnap] = await Promise.all([
        transaction.get(devRef),
        transaction.get(userRef),
      ]);

      const now = admin.firestore.FieldValue.serverTimestamp();
      const devData = devSnap.data();

      if (devSnap.exists && devData) {
        verificationStatus = devData.verificationStatus || 'unverified';
        reputationScore = Number(devData.reputationScore ?? 0);
      }

      const oldSlug = devData?.slug || null;

      // Update developer document
      const devDocPayload = {
        displayName,
        slug: proposedSlug,
        bio,
        skills,
        githubUsername: normalizedGithubUsername,
        githubProfile: githubProfile || null,
        websiteURL: websiteURL || null,
        socialLinks: socialLinks || {},
        coverURL: coverURL || null,
        updatedAt: now,
      };

      if (devSnap.exists) {
        transaction.update(devRef, devDocPayload);
      } else {
        transaction.set(devRef, {
          ...devDocPayload,
          verificationStatus: 'unverified',
          reputationScore: 0,
          followerCount: 0,
          createdAt: now,
        });
      }

      // Update user document
      if (userSnap.exists) {
        transaction.update(userRef, {
          displayName,
          photoURL: photoURL || null,
          updatedAt: now,
        });
      } else {
        transaction.set(userRef, {
          displayName,
          photoURL: photoURL || null,
          role: req.user?.role || 'developer',
          createdAt: now,
          updatedAt: now,
        });
      }

      // Handle old slug redirects
      if (oldSlug && oldSlug !== proposedSlug) {
        // Find all redirect mapping documents owned by this developer and update target to newSlug
        const existingRedirectsQuery = await adminDb
          .collection('developer_slug_redirects')
          .where('developerId', '==', uid)
          .get();

        existingRedirectsQuery.docs.forEach((doc) => {
          transaction.update(doc.ref, {
            newSlug: proposedSlug,
            updatedAt: now,
          });
        });

        // Set the new redirect mapping from oldSlug -> proposedSlug
        const newRedirectRef = adminDb.collection('developer_slug_redirects').doc(oldSlug);
        transaction.set(newRedirectRef, {
          developerId: uid,
          newSlug: proposedSlug,
          createdAt: now,
        });

        // Delete any redirect from proposedSlug -> oldSlug (if they are taking back their old slug)
        const backToOldRedirectRef = adminDb.collection('developer_slug_redirects').doc(proposedSlug);
        transaction.delete(backToOldRedirectRef);
      }
    });

    // 3. Sync to Typesense
    await syncDeveloperToTypesense(
      {
        id: uid,
        displayName,
        bio,
        skills,
        verificationStatus,
        reputationScore,
      },
      'upsert'
    );

    return successResponse({
      uid,
      displayName,
      slug: proposedSlug,
      bio,
      skills,
      githubUsername,
      githubProfile,
      websiteURL,
      socialLinks,
      photoURL,
      coverURL,
    });
  } catch (error) {
    console.error('Error updating developer profile:', error);
    return errorResponse(
      ApiErrors.INTERNAL_ERROR.code,
      'Failed to update developer profile',
      ApiErrors.INTERNAL_ERROR.status
    );
  }
});
