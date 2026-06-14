import 'server-only';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { adminDb } from '@/lib/firebase/admin';
import { listPublishedSoftware, sampleSoftware } from '@/lib/software/data';
import { listPublishedArticles, sampleArticles } from '@/lib/articles/data';
import { SoftwareItem } from '@/lib/software/types';
import { ArticleItem } from '@/lib/articles/types';

export interface LandingStats {
  softwareCount: number;
  developerCount: number;
  articleCount: number;
  downloadCount: number;
}

export interface LandingData {
  stats: LandingStats;
  trendingSoftware: SoftwareItem[];
  recentArticles: ArticleItem[];
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return 0;
}

function isProductionBuildPhase() {
  return process.env.NEXT_PHASE === 'phase-production-build';
}

function getSampleLandingStats(): LandingStats {
  return {
    softwareCount: sampleSoftware.length,
    developerCount: new Set(sampleSoftware.map((item) => item.ownerId).filter(Boolean)).size,
    articleCount: sampleArticles.length,
    downloadCount: sampleSoftware.reduce((sum, item) => sum + item.downloadCount, 0),
  };
}

const fetchLandingStatsCached = unstable_cache(
  async (): Promise<LandingStats> => {
    if (isProductionBuildPhase()) {
      return getSampleLandingStats();
    }

    try {
      const [softwareSnap, articleSnap, usersSnap, downloadsSnap] = await Promise.all([
        adminDb.collection('software').where('status', '==', 'published').count().get(),
        adminDb.collection('articles').where('status', '==', 'published').count().get(),
        adminDb.collection('users').where('role', '==', 'developer').count().get(),
        adminDb.collection('downloads').count().get(),
      ]);

      return {
        softwareCount: toNumber(softwareSnap.data().count),
        developerCount: toNumber(usersSnap.data().count),
        articleCount: toNumber(articleSnap.data().count),
        downloadCount: toNumber(downloadsSnap.data().count),
      };
    } catch (error) {
      console.warn('Landing stats fallback:', error);

      const [softwareSnap, articleSnap, usersSnap, downloadsSnap] = await Promise.all([
        adminDb.collection('software').where('status', '==', 'published').get(),
        adminDb.collection('articles').where('status', '==', 'published').get(),
        adminDb.collection('users').where('role', '==', 'developer').get(),
        adminDb.collection('downloads').get(),
      ]);

      return {
        softwareCount: softwareSnap.size,
        developerCount: usersSnap.size,
        articleCount: articleSnap.size,
        downloadCount: downloadsSnap.size,
      };
    }
  },
  ['landing-stats'],
  { revalidate: 60 }
);

export const getLandingStats = cache(fetchLandingStatsCached);

export const getLandingData = cache(async (): Promise<LandingData> => {
  if (isProductionBuildPhase()) {
    return {
      stats: getSampleLandingStats(),
      trendingSoftware: sampleSoftware.slice(0, 10),
      recentArticles: sampleArticles.slice(0, 6),
    };
  }

  const [stats, software, articles] = await Promise.all([
    getLandingStats(),
    listPublishedSoftware({ sort: 'popularity', limit: 10 }),
    listPublishedArticles({ sort: 'recency', limit: 6 }),
  ]);

  const trendingSoftware = [...software.items]
    .sort((a, b) => {
      const scoreA = a.downloadCount * 0.7 + a.ratingAverage * 30;
      const scoreB = b.downloadCount * 0.7 + b.ratingAverage * 30;
      return scoreB - scoreA;
    })
    .slice(0, 10);

  return {
    stats,
    trendingSoftware,
    recentArticles: articles.items.slice(0, 6),
  };
});
