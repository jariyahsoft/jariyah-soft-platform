import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import { getTypesenseAdminClient } from './client';
import { SoftwareDocument, ArticleDocument, DeveloperDocument } from '../../../src/lib/search/client';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const reconcileSearch = onSchedule('every 24 hours', async (event) => {
  logger.info('Starting nightly search index reconciliation.');
  const db = admin.firestore();
  const client = getTypesenseAdminClient();

  // 1. Reconcile Software
  try {
    const softwareSnapshot = await db.collection('software').where('status', '==', 'published').get();
    const firestoreSoftwareIds = new Set(softwareSnapshot.docs.map(d => d.id));

    // Export all from Typesense
    const typesenseSoftwareData = await client.collections('software').documents().export();
    const typesenseSoftwareStr = typesenseSoftwareData as unknown as string;
    const typesenseSoftwareLines = typesenseSoftwareStr.split('\n').filter(line => line.trim().length > 0);
    const typesenseSoftwareIds = new Set(typesenseSoftwareLines.map(line => {
      try {
        return JSON.parse(line).id;
      } catch (e) {
        return null;
      }
    }).filter(Boolean));

    let softwareAdded = 0;
    let softwareRemoved = 0;

    // Add missing
    for (const doc of softwareSnapshot.docs) {
      if (!typesenseSoftwareIds.has(doc.id)) {
        const data = doc.data();
        const searchDoc: SoftwareDocument = {
          id: doc.id,
          name: String(data.name ?? ''),
          shortDescription: String(data.shortDescription ?? ''),
          categoryId: String(data.categoryId ?? ''),
          categoryName: String(data.categoryName ?? ''),
          tagIds: Array.isArray(data.tagIds) ? data.tagIds : [],
          platforms: Array.isArray(data.platforms) ? data.platforms : [],
          downloadCount: Number(data.downloadCount ?? 0),
          ratingAverage: Number(data.ratingAverage ?? 0),
          publishedAt: data.publishedAt?.toMillis() ?? Date.now(),
        };
        await client.collections('software').documents().upsert(searchDoc);
        softwareAdded++;
      }
    }

    // Remove extra
    for (const id of typesenseSoftwareIds) {
      if (!firestoreSoftwareIds.has(id)) {
        await client.collections('software').documents(id).delete();
        softwareRemoved++;
      }
    }

    logger.info(`Reconciled Software: Added ${softwareAdded}, Removed ${softwareRemoved}`);
  } catch (error) {
    logger.error('Error reconciling software:', error);
  }

  // 2. Reconcile Articles
  try {
    const articleSnapshot = await db.collection('articles').where('status', '==', 'published').get();
    const firestoreArticleIds = new Set(articleSnapshot.docs.map(d => d.id));

    const typesenseArticleData = await client.collections('articles').documents().export();
    const typesenseArticleStr = typesenseArticleData as unknown as string;
    const typesenseArticleLines = typesenseArticleStr.split('\n').filter(line => line.trim().length > 0);
    const typesenseArticleIds = new Set(typesenseArticleLines.map(line => {
      try {
        return JSON.parse(line).id;
      } catch (e) {
        return null;
      }
    }).filter(Boolean));

    let articleAdded = 0;
    let articleRemoved = 0;

    for (const doc of articleSnapshot.docs) {
      if (!typesenseArticleIds.has(doc.id)) {
        const data = doc.data();
        const searchDoc: ArticleDocument = {
          id: doc.id,
          title: String(data.title ?? ''),
          excerpt: String(data.excerpt ?? ''),
          categoryId: String(data.categoryId ?? ''),
          categoryName: String(data.categoryName ?? ''),
          tagIds: Array.isArray(data.tagIds) ? data.tagIds : [],
          authorName: String(data.authorName ?? ''),
          language: String(data.language ?? 'th'),
          viewCount: Number(data.viewCount ?? 0),
          publishedAt: data.publishedAt?.toMillis() ?? Date.now(),
        };
        await client.collections('articles').documents().upsert(searchDoc);
        articleAdded++;
      }
    }

    for (const id of typesenseArticleIds) {
      if (!firestoreArticleIds.has(id)) {
        await client.collections('articles').documents(id).delete();
        articleRemoved++;
      }
    }

    logger.info(`Reconciled Articles: Added ${articleAdded}, Removed ${articleRemoved}`);
  } catch (error) {
    logger.error('Error reconciling articles:', error);
  }

  // 3. Reconcile Developers
  try {
    const devSnapshot = await db.collection('developers').where('verificationStatus', '==', 'verified').get();
    const firestoreDevIds = new Set(devSnapshot.docs.map(d => d.id));

    const typesenseDevData = await client.collections('developers').documents().export();
    const typesenseDevStr = typesenseDevData as unknown as string;
    const typesenseDevLines = typesenseDevStr.split('\n').filter(line => line.trim().length > 0);
    const typesenseDevIds = new Set(typesenseDevLines.map(line => {
      try {
        return JSON.parse(line).id;
      } catch (e) {
        return null;
      }
    }).filter(Boolean));

    let devAdded = 0;
    let devRemoved = 0;

    for (const doc of devSnapshot.docs) {
      if (!typesenseDevIds.has(doc.id)) {
        const data = doc.data();
        const searchDoc: DeveloperDocument = {
          id: doc.id,
          displayName: String(data.displayName ?? ''),
          bio: String(data.bio ?? ''),
          skills: Array.isArray(data.skills) ? data.skills : [],
          verificationStatus: String(data.verificationStatus ?? 'verified'),
          reputationScore: Number(data.reputationScore ?? 0),
        };
        await client.collections('developers').documents().upsert(searchDoc);
        devAdded++;
      }
    }

    for (const id of typesenseDevIds) {
      if (!firestoreDevIds.has(id)) {
        await client.collections('developers').documents(id).delete();
        devRemoved++;
      }
    }

    logger.info(`Reconciled Developers: Added ${devAdded}, Removed ${devRemoved}`);
  } catch (error) {
    logger.error('Error reconciling developers:', error);
  }
});
