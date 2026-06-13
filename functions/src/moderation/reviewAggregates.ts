import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

function countTowardsAggregate(status: unknown) {
  return status === 'approved';
}

export const onReviewWrite = onDocumentWritten(
  {
    document: 'reviews/{reviewId}',
    retry: true,
  },
  async (event) => {
    if (!event.data) return;

    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();
    const beforeCounts = countTowardsAggregate(beforeData?.status);
    const afterCounts = countTowardsAggregate(afterData?.status);

    if (!afterData && !beforeData) return;

    const softwareId = String(afterData?.softwareId ?? beforeData?.softwareId ?? '');
    if (!softwareId) return;

    // Ignore writes that don't affect approval state or score data for approved reviews.
    if (beforeCounts === afterCounts) {
      if (!afterCounts) return;
      const ratingChanged = Number(beforeData?.rating ?? 0) !== Number(afterData?.rating ?? 0);
      if (!ratingChanged) return;
    }

    const db = admin.firestore();
    const softwareRef = db.collection('software').doc(softwareId);

    await db.runTransaction(async (transaction) => {
      const softwareSnap = await transaction.get(softwareRef);
      if (!softwareSnap.exists) return;

      const approvedReviewsSnap = await transaction.get(
        db.collection('reviews').where('softwareId', '==', softwareId).where('status', '==', 'approved')
      );

      const approvedRatings = approvedReviewsSnap.docs.map((doc) => Number(doc.data().rating ?? 0)).filter((rating) => rating > 0);
      const ratingCount = approvedRatings.length;
      const ratingAverage = ratingCount > 0 ? approvedRatings.reduce((sum, rating) => sum + rating, 0) / ratingCount : 0;

      transaction.update(softwareRef, {
        ratingAverage: Number(ratingAverage.toFixed(2)),
        ratingCount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  }
);
