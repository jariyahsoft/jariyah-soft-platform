import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import { getTypesenseAdminClient } from './client';
import { SoftwareDocument, ArticleDocument, DeveloperDocument } from '../../../src/lib/search/client';

export const onSoftwareWrite = onDocumentWritten(
  {
    document: 'software/{softwareId}',
    retry: true,
  },
  async (event) => {
    const client = getTypesenseAdminClient();
    const softwareId = event.params.softwareId;

    if (!event.data) {
      return;
    }

    const dataAfter = event.data.after.data();
    const isPublished = dataAfter && dataAfter.status === 'published';

    if (!isPublished) {
      // If it's deleted or not published, remove from search index
      try {
        await client.collections('software').documents(softwareId).delete();
        logger.info(`Removed software ${softwareId} from index (unpublished or deleted).`);
      } catch (error: any) {
        if (error.httpStatus !== 404) {
          logger.error(`Failed to remove software ${softwareId} from index:`, error);
          throw error;
        }
      }
      return;
    }

    // Upsert to index
    const doc: SoftwareDocument = {
      id: softwareId,
      name: String(dataAfter.name ?? ''),
      shortDescription: String(dataAfter.shortDescription ?? ''),
      categoryId: String(dataAfter.categoryId ?? ''),
      categoryName: String(dataAfter.categoryName ?? ''), // Usually you'd join this from master data, assuming it's denormalized here
      tagIds: Array.isArray(dataAfter.tagIds) ? dataAfter.tagIds : [],
      platforms: Array.isArray(dataAfter.platforms) ? dataAfter.platforms : [],
      downloadCount: Number(dataAfter.downloadCount ?? 0),
      ratingAverage: Number(dataAfter.ratingAverage ?? 0),
      publishedAt: dataAfter.publishedAt ? dataAfter.publishedAt.toMillis() : Date.now(),
    };

    try {
      await client.collections('software').documents().upsert(doc);
      logger.info(`Upserted software ${softwareId} to index.`);
      
      // Update searchSyncStatus in Firestore (requires admin SDK, but we are just returning success for now to avoid infinite loop)
      // Note: updating the same document requires care to not trigger another infinite loop if we don't check for changes.
      // Usually done by comparing `dataBefore.searchSyncStatus`.
      const dataBefore = event.data.before.data();
      if (!dataBefore || dataBefore.searchSyncStatus !== 'synced') {
        await event.data.after.ref.update({ searchSyncStatus: 'synced' });
      }
    } catch (error) {
      logger.error(`Failed to upsert software ${softwareId} to index:`, error);
      
      const dataBefore = event.data.before.data();
      if (!dataBefore || dataBefore.searchSyncStatus !== 'failed') {
        await event.data.after.ref.update({ searchSyncStatus: 'failed' });
      }
      throw error;
    }
  }
);

export const onArticleWrite = onDocumentWritten(
  {
    document: 'articles/{articleId}',
    retry: true,
  },
  async (event) => {
    const client = getTypesenseAdminClient();
    const articleId = event.params.articleId;

    if (!event.data) {
      return;
    }

    const dataAfter = event.data.after.data();
    const isPublished = dataAfter && dataAfter.status === 'published';

    if (!isPublished) {
      try {
        await client.collections('articles').documents(articleId).delete();
        logger.info(`Removed article ${articleId} from index (unpublished or deleted).`);
      } catch (error: any) {
        if (error.httpStatus !== 404) {
          logger.error(`Failed to remove article ${articleId} from index:`, error);
          throw error;
        }
      }
      return;
    }

    const doc: ArticleDocument = {
      id: articleId,
      title: String(dataAfter.title ?? ''),
      excerpt: String(dataAfter.excerpt ?? ''),
      categoryId: String(dataAfter.categoryId ?? ''),
      categoryName: String(dataAfter.categoryName ?? ''),
      tagIds: Array.isArray(dataAfter.tagIds) ? dataAfter.tagIds : [],
      authorName: String(dataAfter.authorName ?? ''),
      language: String(dataAfter.language ?? 'th'),
      viewCount: Number(dataAfter.viewCount ?? 0),
      publishedAt: dataAfter.publishedAt ? dataAfter.publishedAt.toMillis() : Date.now(),
    };

    try {
      await client.collections('articles').documents().upsert(doc);
      logger.info(`Upserted article ${articleId} to index.`);
    } catch (error) {
      logger.error(`Failed to upsert article ${articleId} to index:`, error);
      throw error;
    }
  }
);

export const onDeveloperWrite = onDocumentWritten(
  {
    document: 'developers/{uid}',
    retry: true,
  },
  async (event) => {
    const client = getTypesenseAdminClient();
    const uid = event.params.uid;

    if (!event.data) {
      return;
    }

    const dataAfter = event.data.after.data();
    // Only index developers who are verified, or maybe pending too depending on product requirement.
    // Assuming 'verified' only for now.
    const isVerified = dataAfter && dataAfter.verificationStatus === 'verified';

    if (!isVerified) {
      try {
        await client.collections('developers').documents(uid).delete();
        logger.info(`Removed developer ${uid} from index (not verified or deleted).`);
      } catch (error: any) {
        if (error.httpStatus !== 404) {
          logger.error(`Failed to remove developer ${uid} from index:`, error);
          throw error;
        }
      }
      return;
    }

    const doc: DeveloperDocument = {
      id: uid,
      displayName: String(dataAfter.displayName ?? ''),
      bio: String(dataAfter.bio ?? ''),
      skills: Array.isArray(dataAfter.skills) ? dataAfter.skills : [],
      verificationStatus: String(dataAfter.verificationStatus ?? 'verified'),
      reputationScore: Number(dataAfter.reputationScore ?? 0),
    };

    try {
      await client.collections('developers').documents().upsert(doc);
      logger.info(`Upserted developer ${uid} to index.`);
    } catch (error) {
      logger.error(`Failed to upsert developer ${uid} to index:`, error);
      throw error;
    }
  }
);
