import 'server-only';

import { Client } from 'typesense';

const TYPESENSE_HOST = process.env.NEXT_PUBLIC_TYPESENSE_HOST ?? process.env.TYPESENSE_HOST ?? 'localhost';
const TYPESENSE_PORT = parseInt(process.env.NEXT_PUBLIC_TYPESENSE_PORT ?? process.env.TYPESENSE_PORT ?? '8108', 10);
const TYPESENSE_PROTOCOL = process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL ?? process.env.TYPESENSE_PROTOCOL ?? 'http';
const TYPESENSE_SEARCH_API_KEY = process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY ?? 'test-search-key';
const TYPESENSE_ADMIN_API_KEY = process.env.TYPESENSE_ADMIN_API_KEY ?? 'test-admin-key';

let searchClient: Client | null = null;
let adminClient: Client | null = null;

export function getTypesenseClient(): Client {
  if (!searchClient) {
    searchClient = new Client({
      nodes: [
        {
          host: TYPESENSE_HOST,
          port: TYPESENSE_PORT,
          protocol: TYPESENSE_PROTOCOL as 'http' | 'https',
        },
      ],
      apiKey: TYPESENSE_SEARCH_API_KEY,
      connectionTimeoutSeconds: 2,
    });
  }
  return searchClient;
}

export function getTypesenseAdminClient(): Client {
  if (!adminClient) {
    adminClient = new Client({
      nodes: [
        {
          host: TYPESENSE_HOST,
          port: TYPESENSE_PORT,
          protocol: TYPESENSE_PROTOCOL as 'http' | 'https',
        },
      ],
      apiKey: TYPESENSE_ADMIN_API_KEY,
      connectionTimeoutSeconds: 2,
    });
  }
  return adminClient;
}

export interface SoftwareDocument {
  id: string;
  name: string;
  shortDescription: string;
  categoryId: string;
  categoryName: string;
  tagIds: string[];
  platforms: string[];
  downloadCount: number;
  ratingAverage: number;
  publishedAt: number;
}

export interface ArticleDocument {
  id: string;
  title: string;
  excerpt: string;
  categoryId: string;
  categoryName: string;
  tagIds: string[];
  authorName: string;
  language: string;
  viewCount: number;
  publishedAt: number;
}

export interface DeveloperDocument {
  id: string;
  displayName: string;
  bio: string;
  skills: string[];
  verificationStatus: string;
  reputationScore: number;
}

export async function syncSoftwareToTypesense(doc: Record<string, unknown>, action: 'upsert' | 'delete') {
  const client = getTypesenseAdminClient();
  const document: SoftwareDocument = {
    id: String(doc.id ?? ''),
    name: String(doc.name ?? ''),
    shortDescription: String(doc.shortDescription ?? ''),
    categoryId: String(doc.categoryId ?? ''),
    categoryName: String(doc.categoryName ?? ''),
    tagIds: Array.isArray(doc.tagIds) ? doc.tagIds : [],
    platforms: Array.isArray(doc.platforms) ? doc.platforms : [],
    downloadCount: Number(doc.downloadCount ?? 0),
    ratingAverage: Number(doc.ratingAverage ?? 0),
    publishedAt: doc.publishedAt instanceof Date ? doc.publishedAt.getTime() : Date.now(),
  };

  try {
    if (action === 'upsert') {
      await client.collections('software').documents().upsert(document);
    } else {
      await client.collections('software').documents(String(doc.id)).delete();
    }
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

export async function syncArticleToTypesense(doc: Record<string, unknown>, action: 'upsert' | 'delete') {
  const client = getTypesenseAdminClient();
  const document: ArticleDocument = {
    id: String(doc.id ?? ''),
    title: String(doc.title ?? ''),
    excerpt: String(doc.excerpt ?? ''),
    categoryId: String(doc.categoryId ?? ''),
    categoryName: String(doc.categoryName ?? ''),
    tagIds: Array.isArray(doc.tagIds) ? doc.tagIds : [],
    authorName: String(doc.authorName ?? ''),
    language: String(doc.language ?? 'th'),
    viewCount: Number(doc.viewCount ?? 0),
    publishedAt: doc.publishedAt instanceof Date ? doc.publishedAt.getTime() : Date.now(),
  };

  try {
    if (action === 'upsert') {
      await client.collections('articles').documents().upsert(document);
    } else {
      await client.collections('articles').documents(String(doc.id)).delete();
    }
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

export async function syncDeveloperToTypesense(doc: Record<string, unknown>, action: 'upsert' | 'delete') {
  const client = getTypesenseAdminClient();
  const document: DeveloperDocument = {
    id: String(doc.id ?? ''),
    displayName: String(doc.displayName ?? ''),
    bio: String(doc.bio ?? ''),
    skills: Array.isArray(doc.skills) ? doc.skills : [],
    verificationStatus: String(doc.verificationStatus ?? 'unverified'),
    reputationScore: Number(doc.reputationScore ?? 0),
  };

  try {
    if (action === 'upsert') {
      await client.collections('developers').documents().upsert(document);
    } else {
      await client.collections('developers').documents(String(doc.id)).delete();
    }
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}