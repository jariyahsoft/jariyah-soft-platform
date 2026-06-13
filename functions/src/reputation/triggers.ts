import * as admin from 'firebase-admin';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { createNotification } from '../notifications/triggers';

// Transactional helper to award points safely and handle auto-creation of developer profile
export const awardReputationPoints = async (
  userId: string,
  event: 'software_published' | 'article_published' | 'review_approved' | 'download_milestone' | 'badge_earned' | 'report_upheld',
  points: number,
  referenceId: string
) => {
  const db = admin.firestore();
  const developerRef = db.collection('developers').doc(userId);
  const logRef = db.collection('reputation_logs').doc();
  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    const devSnap = await transaction.get(developerRef);
    
    if (!devSnap.exists) {
      // Fetch user details for display name
      const userRef = db.collection('users').doc(userId);
      const userSnap = await transaction.get(userRef);
      
      let displayName = 'User';
      if (userSnap.exists) {
        displayName = userSnap.data()?.displayName || 'User';
      }
      
      const baseSlug = displayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const slug = baseSlug || userId;

      transaction.set(developerRef, {
        displayName,
        slug,
        verificationStatus: 'unverified',
        reputationScore: points,
        followerCount: 0,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      transaction.update(developerRef, {
        reputationScore: admin.firestore.FieldValue.increment(points),
        updatedAt: now,
      });
    }

    transaction.set(logRef, {
      userId,
      event,
      points,
      referenceId,
      createdAt: now,
    });
  });
};

// Check and award badges that are not yet awarded
export const checkAndAwardBadges = async (developerId: string) => {
  const db = admin.firestore();
  
  const badgeSlugs = [
    'first_software',
    'open_source_contributor',
    'top_author',
    'top_developer',
    'community_helper',
    'verified_developer'
  ];

  for (const slug of badgeSlugs) {
    const badgeAwardId = `${developerId}_${slug}`;
    const awardRef = db.collection('developer_badges').doc(badgeAwardId);

    const awardSnap = await awardRef.get();
    if (awardSnap.exists) continue; // Already awarded

    let meetsCriteria = false;

    if (slug === 'first_software' || slug === 'top_developer') {
      const swSnap = await db.collection('software')
        .where('ownerId', '==', developerId)
        .where('status', '==', 'published')
        .get();
      
      const count = swSnap.size;
      if (slug === 'first_software' && count >= 1) meetsCriteria = true;
      if (slug === 'top_developer' && count >= 5) meetsCriteria = true;
    } 
    else if (slug === 'top_author') {
      const artSnap = await db.collection('articles')
        .where('authorId', '==', developerId)
        .where('status', '==', 'published')
        .get();
      
      if (artSnap.size >= 10) meetsCriteria = true;
    } 
    else if (slug === 'community_helper') {
      const revSnap = await db.collection('reviews')
        .where('userId', '==', developerId)
        .where('status', '==', 'approved')
        .get();
      
      if (revSnap.size >= 50) meetsCriteria = true;
    } 
    else if (slug === 'verified_developer') {
      const devSnap = await db.collection('developers').doc(developerId).get();
      if (devSnap.exists && devSnap.data()?.verificationStatus === 'verified') {
        meetsCriteria = true;
      }
    } 
    else if (slug === 'open_source_contributor') {
      let count = 0;
      try {
        const [contribSnap, ownerSnap] = await Promise.all([
          db.collection('incubator_projects').where('contributors', 'array-contains', developerId).get(),
          db.collection('incubator_projects').where('ownerId', '==', developerId).get()
        ]);
        const uniqueIds = new Set([
          ...contribSnap.docs.map(d => d.id),
          ...ownerSnap.docs.map(d => d.id)
        ]);
        count = uniqueIds.size;
      } catch (e) {
        count = 0; // Graceful fallback
      }
      if (count >= 3) meetsCriteria = true;
    }

    if (meetsCriteria) {
      // Get badge master metadata if exists
      const badgeSnap = await db.collection('badges').doc(slug).get();
      let badgeData = badgeSnap.exists ? badgeSnap.data() : null;
      if (!badgeData) {
        // Try hyphenated version
        const hyphenSlug = slug.replace(/_/g, '-');
        const badgeHyphenSnap = await db.collection('badges').doc(hyphenSlug).get();
        if (badgeHyphenSnap.exists) badgeData = badgeHyphenSnap.data();
      }

      const nameTH = badgeData?.name?.th || slug;
      const nameEN = badgeData?.name?.en || slug;

      const now = admin.firestore.FieldValue.serverTimestamp();
      await awardRef.set({
        developerId,
        badgeId: slug,
        badgeName: { th: nameTH, en: nameEN },
        awardedAt: now
      });

      // Send badge earned notification
      await createNotification(
        developerId,
        'badge.earned',
        {
          badgeName: nameTH,
          badgeNameTH: nameTH,
          badgeNameEN: nameEN,
          badgeSlug: slug
        },
        ['in_app', 'email'],
        `badge_${slug}_${developerId}`
      );
    }
  }
};

// Triggers
export const onSoftwarePublishedReputation = onDocumentUpdated(
  { document: 'software/{softwareId}', retry: true },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    // Trigger on status change to published
    if (before.status !== 'published' && after.status === 'published') {
      const developerId = after.ownerId;
      await awardReputationPoints(developerId, 'software_published', 50, event.params.softwareId);
      await checkAndAwardBadges(developerId);
    }
  }
);

export const onArticlePublishedReputation = onDocumentUpdated(
  { document: 'articles/{articleId}', retry: true },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    // Trigger on status change to published
    if (before.status !== 'published' && after.status === 'published') {
      const developerId = after.authorId;
      await awardReputationPoints(developerId, 'article_published', 30, event.params.articleId);
      await checkAndAwardBadges(developerId);
    }
  }
);

export const onReviewApprovedReputation = onDocumentUpdated(
  { document: 'reviews/{reviewId}', retry: true },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    // Trigger on status change to approved
    if (before.status !== 'approved' && after.status === 'approved') {
      const reviewerId = after.userId;
      await awardReputationPoints(reviewerId, 'review_approved', 10, event.params.reviewId);
      await checkAndAwardBadges(reviewerId);
    }
  }
);

export const onDownloadMilestoneReputation = onDocumentUpdated(
  { document: 'software/{softwareId}', retry: true },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    // Trigger on crossing 100 downloads threshold
    if ((before.downloadCount || 0) < 100 && (after.downloadCount || 0) >= 100) {
      const developerId = after.ownerId;
      await awardReputationPoints(developerId, 'download_milestone', 20, event.params.softwareId);
    }
  }
);

export const onBadgeEarnedReputation = onDocumentCreated(
  { document: 'developer_badges/{awardId}', retry: true },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const data = snapshot.data();
    const developerId = data.developerId;
    if (developerId) {
      await awardReputationPoints(developerId, 'badge_earned', 15, data.badgeId);
    }
  }
);

export const onReportUpheldReputation = onDocumentUpdated(
  { document: 'reports/{reportId}', retry: true },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    // Trigger when report resolved and upheld
    if (before.status !== 'resolved' && after.status === 'resolved' && after.resolution === 'action_taken') {
      const reporterId = after.reporterId;
      if (reporterId) {
        await awardReputationPoints(reporterId, 'report_upheld', 5, event.params.reportId);
      }
    }
  }
);

export const onDeveloperVerifiedReputation = onDocumentUpdated(
  { document: 'developers/{uid}', retry: true },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    // Trigger when developer verificationStatus changes to verified
    if (before.verificationStatus !== 'verified' && after.verificationStatus === 'verified') {
      await checkAndAwardBadges(event.params.uid);
    }
  }
);
