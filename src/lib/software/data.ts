import 'server-only';

import { cache } from 'react';
import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import {
  SOFTWARE_CATEGORIES,
  SOFTWARE_LICENSES,
  SoftwareItem,
} from '@/lib/software/types';

interface ListSoftwareOptions {
  category?: string;
  platform?: string;
  sort?: string;
  limit?: number;
}

const now = new Date().toISOString();

const sampleSoftware: SoftwareItem[] = [
  {
    id: 'sample-prompt-studio',
    ownerId: 'sample-dev',
    name: 'Prompt Studio TH',
    slug: 'prompt-studio-th',
    developerName: 'Jariyah Labs',
    shortDescription: 'A bilingual prompt workspace for Thai teams building safer AI workflows.',
    description:
      'Prompt Studio TH helps teams create, review, and reuse prompts with bilingual documentation, approval notes, and lightweight safety checklists.',
    categoryId: 'developer-tools',
    categoryName: 'Developer Tools',
    tagIds: ['ai', 'prompting', 'thai'],
    platforms: ['web', 'windows', 'mac'],
    licenseId: 'MIT',
    licenseName: 'MIT',
    logoPath: '',
    screenshotPaths: [],
    repositoryURL: 'https://github.com/example/prompt-studio-th',
    websiteURL: 'https://example.com/prompt-studio-th',
    downloadURL: 'https://example.com/downloads/prompt-studio-th',
    fileSize: '48 MB',
    latestVersion: '1.4.2',
    releaseNotes: 'Adds bilingual review queues, safer sharing defaults, and improved import templates.',
    status: 'published',
    ratingAverage: 4.7,
    ratingCount: 128,
    downloadCount: 18420,
    publishedAt: now,
    updatedAt: now,
    etag: '"sample"',
  },
  {
    id: 'sample-school-ledger',
    ownerId: 'sample-dev',
    name: 'School Ledger Lite',
    slug: 'school-ledger-lite',
    developerName: 'North Star Apps',
    shortDescription: 'Simple classroom finance and inventory tracking for small schools.',
    description:
      'School Ledger Lite keeps fee records, supplies, approvals, and exports in one approachable dashboard for school administrators.',
    categoryId: 'education',
    categoryName: 'Education',
    tagIds: ['school', 'finance'],
    platforms: ['web', 'mobile'],
    licenseId: 'Proprietary',
    licenseName: 'Proprietary',
    screenshotPaths: [],
    websiteURL: 'https://example.com/school-ledger-lite',
    downloadURL: 'https://example.com/downloads/school-ledger-lite',
    fileSize: 'Web app',
    latestVersion: '0.9.8',
    releaseNotes: 'Improves mobile approval flows and CSV exports.',
    status: 'published',
    ratingAverage: 4.4,
    ratingCount: 64,
    downloadCount: 9320,
    publishedAt: now,
    updatedAt: now,
    etag: '"sample"',
  },
];

function timestampToIso(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof admin.firestore.Timestamp) return value.toDate().toISOString();
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === 'string') return value;
  return undefined;
}

function resolveCategoryName(categoryId?: string): string {
  return SOFTWARE_CATEGORIES.find((category) => category.id === categoryId)?.name ?? categoryId ?? 'General';
}

function resolveLicenseName(licenseId?: string): string {
  return SOFTWARE_LICENSES.find((license) => license.id === licenseId)?.name ?? licenseId ?? 'Other';
}

function toSoftwareItem(doc: admin.firestore.QueryDocumentSnapshot | admin.firestore.DocumentSnapshot): SoftwareItem {
  const data = doc.data() ?? {};
  const updatedAt = timestampToIso(data.updatedAt);

  return {
    id: doc.id,
    ownerId: data.ownerId,
    name: data.name ?? 'Untitled software',
    slug: data.slug ?? doc.id,
    developerName: data.developerName ?? data.ownerName ?? 'Independent developer',
    shortDescription: data.shortDescription ?? '',
    description: data.description ?? data.shortDescription ?? '',
    categoryId: data.categoryId ?? 'general',
    categoryName: data.categoryName ?? resolveCategoryName(data.categoryId),
    tagIds: Array.isArray(data.tagIds) ? data.tagIds : [],
    platforms: Array.isArray(data.platforms) ? data.platforms : [],
    licenseId: data.licenseId ?? 'Other',
    licenseName: data.licenseName ?? resolveLicenseName(data.licenseId),
    logoPath: data.logoPath,
    screenshotPaths: Array.isArray(data.screenshotPaths) ? data.screenshotPaths : [],
    repositoryURL: data.repositoryURL,
    websiteURL: data.websiteURL,
    downloadURL: data.downloadURL,
    fileSize: data.fileSize,
    latestVersion: data.latestVersion ?? data.version,
    releaseNotes: data.releaseNotes,
    status: data.status ?? 'draft',
    ratingAverage: Number(data.ratingAverage ?? 0),
    ratingCount: Number(data.ratingCount ?? 0),
    downloadCount: Number(data.downloadCount ?? 0),
    publishedAt: timestampToIso(data.publishedAt),
    updatedAt,
    rejectionReason: data.rejectionReason ?? data.moderationReason,
    etag: updatedAt ? `"${new Date(updatedAt).getTime()}"` : undefined,
  };
}

function sortSoftware(items: SoftwareItem[], sort = 'relevance') {
  return [...items].sort((a, b) => {
    if (sort === 'popularity') return b.downloadCount - a.downloadCount;
    if (sort === 'recency') {
      return new Date(b.publishedAt ?? b.updatedAt ?? 0).getTime() - new Date(a.publishedAt ?? a.updatedAt ?? 0).getTime();
    }
    return b.ratingAverage - a.ratingAverage || b.downloadCount - a.downloadCount;
  });
}

export const listPublishedSoftware = cache(async (options: ListSoftwareOptions = {}) => {
  const { category, platform, sort, limit = 24 } = options;

  try {
    let query: admin.firestore.Query = adminDb.collection('software').where('status', '==', 'published');

    if (category) query = query.where('categoryId', '==', category);
    if (platform) query = query.where('platforms', 'array-contains', platform);
    if (sort === 'popularity') {
      query = query.orderBy('downloadCount', 'desc');
    } else if (sort === 'recency') {
      query = query.orderBy('publishedAt', 'desc');
    } else {
      query = query.orderBy('ratingAverage', 'desc');
    }

    const snapshot = await query.limit(limit).get();
    const items = snapshot.docs.map(toSoftwareItem);
    return { items, source: 'firestore' as const, error: null };
  } catch (error) {
    console.warn('Using sample software fallback:', error);
    const filtered = sampleSoftware.filter((item) => {
      return (!category || item.categoryId === category) && (!platform || item.platforms.includes(platform));
    });
    return { items: sortSoftware(filtered, sort).slice(0, limit), source: 'sample' as const, error };
  }
});

export const getPublishedSoftwareBySlug = cache(async (slug: string) => {
  try {
    const directDoc = await adminDb.collection('software').doc(slug).get();
    if (directDoc.exists && directDoc.data()?.status === 'published') {
      return toSoftwareItem(directDoc);
    }

    const snapshot = await adminDb
      .collection('software')
      .where('slug', '==', slug)
      .where('status', '==', 'published')
      .limit(1)
      .get();

    const firstDoc = snapshot.docs.at(0);
    if (firstDoc) return toSoftwareItem(firstDoc);
  } catch (error) {
    console.warn('Using sample software detail fallback:', error);
  }

  return sampleSoftware.find((item) => item.slug === slug || item.id === slug) ?? null;
});
