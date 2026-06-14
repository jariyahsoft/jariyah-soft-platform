import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';
import { getTypesenseAdminClient } from './client';
import * as logger from 'firebase-functions/logger';

export const softwareSchema: CollectionCreateSchema = {
  name: 'software',
  fields: [
    { name: 'name', type: 'string', locale: 'th' },
    { name: 'shortDescription', type: 'string', locale: 'th' },
    { name: 'categoryId', type: 'string', facet: true },
    { name: 'categoryName', type: 'string', facet: true, locale: 'th' },
    { name: 'tagIds', type: 'string[]', facet: true },
    { name: 'platforms', type: 'string[]', facet: true },
    { name: 'ratingAverage', type: 'float', facet: true },
    { name: 'downloadCount', type: 'int32', facet: true },
    { name: 'publishedAt', type: 'int64' },
  ],
  default_sorting_field: 'publishedAt',
};

export const articleSchema: CollectionCreateSchema = {
  name: 'articles',
  fields: [
    { name: 'title', type: 'string', locale: 'th' },
    { name: 'excerpt', type: 'string', locale: 'th' },
    { name: 'body', type: 'string', locale: 'th', optional: true },
    { name: 'categoryId', type: 'string', facet: true },
    { name: 'categoryName', type: 'string', facet: true, locale: 'th' },
    { name: 'tagIds', type: 'string[]', facet: true },
    { name: 'authorName', type: 'string', locale: 'th' },
    { name: 'language', type: 'string', facet: true },
    { name: 'viewCount', type: 'int32', facet: true },
    { name: 'publishedAt', type: 'int64' },
  ],
  default_sorting_field: 'publishedAt',
};

export const developerSchema: CollectionCreateSchema = {
  name: 'developers',
  fields: [
    { name: 'displayName', type: 'string', locale: 'th' },
    { name: 'bio', type: 'string', locale: 'th', optional: true },
    { name: 'skills', type: 'string[]', facet: true },
    { name: 'verificationStatus', type: 'string', facet: true },
    { name: 'reputationScore', type: 'int32', facet: true },
  ],
  default_sorting_field: 'reputationScore',
};

export const jobSchema: CollectionCreateSchema = {
  name: 'jobs',
  fields: [
    { name: 'title', type: 'string', locale: 'th' },
    { name: 'organization', type: 'string', locale: 'th' },
    { name: 'description', type: 'string', locale: 'th', optional: true },
    { name: 'jobType', type: 'string', facet: true },
    { name: 'workMode', type: 'string', facet: true },
    { name: 'location', type: 'string', facet: true, optional: true },
    { name: 'skills', type: 'string[]', facet: true },
    { name: 'publishedAt', type: 'int64' },
    { name: 'expiresAt', type: 'int64' },
  ],
  default_sorting_field: 'publishedAt',
};

export const incubatorSchema: CollectionCreateSchema = {
  name: 'incubator_projects',
  fields: [
    { name: 'name', type: 'string', locale: 'th' },
    { name: 'description', type: 'string', locale: 'th', optional: true },
    { name: 'stage', type: 'string', facet: true },
    { name: 'skillNeeds', type: 'string[]', facet: true },
    { name: 'updatedAt', type: 'int64' },
  ],
  default_sorting_field: 'updatedAt',
};

export async function initializeSchemas() {
  const client = getTypesenseAdminClient();
  const schemas = [softwareSchema, articleSchema, developerSchema, jobSchema, incubatorSchema];

  for (const schema of schemas) {
    try {
      await client.collections(schema.name).retrieve();
      logger.info(`Collection ${schema.name} already exists.`);
      // Optionally update the schema if needed here, but Typesense schema updates are limited
    } catch (error: any) {
      if (error.httpStatus === 404) {
        logger.info(`Creating collection ${schema.name}...`);
        await client.collections().create(schema);
        logger.info(`Created collection ${schema.name}.`);
      } else {
        logger.error(`Error checking collection ${schema.name}:`, error);
        throw error;
      }
    }
  }
}

