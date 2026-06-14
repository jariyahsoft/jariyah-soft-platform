import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { getTypesenseAdminClient } from '../search/client';
import * as logger from 'firebase-functions/logger';

const db = admin.firestore();

/**
 * Runs daily at midnight UTC.
 * Finds published jobs that have passed their expiresAt and marks them as 'expired'.
 * Also removes them from the Typesense search index.
 */
export const expireJobs = onSchedule(
  {
    schedule: 'every 24 hours',
    timeZone: 'UTC',
    retryCount: 1,
  },
  async () => {
    logger.info('Running job expiry function...');

    const now = admin.firestore.Timestamp.now();
    const typesense = getTypesenseAdminClient();

    const expiredSnap = await db
      .collection('jobs')
      .where('status', '==', 'published')
      .where('expiresAt', '<=', now)
      .limit(400)
      .get();

    if (expiredSnap.empty) {
      logger.info('No expired jobs found.');
      return;
    }

    logger.info(`Found ${expiredSnap.size} expired jobs to process.`);

    const batch = db.batch();

    for (const doc of expiredSnap.docs) {
      batch.update(doc.ref, {
        status: 'expired',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    logger.info(`Marked ${expiredSnap.size} jobs as expired in Firestore.`);

    // Remove from Typesense index
    let removedCount = 0;
    for (const doc of expiredSnap.docs) {
      try {
        await typesense.collections('jobs').documents(doc.id).delete();
        removedCount++;
      } catch (err: any) {
        if (err.httpStatus !== 404) {
          logger.error(`Failed to remove job ${doc.id} from Typesense:`, err);
        }
      }
    }

    logger.info(`Removed ${removedCount} expired jobs from Typesense.`);
  }
);
