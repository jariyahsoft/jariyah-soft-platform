import { adminDb } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';
import { withRole } from '@/lib/api/withRole';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';

// POST /api/v1/admin/calculate-trending
export const POST = withRole('admin', async (req: any) => {
  try {
    // 1. Fetch all published software
    const softwareSnap = await adminDb.collection('software')
      .where('status', '==', 'published')
      .get();

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 2. Fetch all downloads from last 30 days
    const downloadsSnap = await adminDb.collection('downloads')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(oneMonthAgo))
      .get();

    const downloadsWeek: Record<string, number> = {};
    const downloadsMonth: Record<string, number> = {};

    downloadsSnap.docs.forEach(doc => {
      const data = doc.data();
      const softwareId = data.softwareId;
      const createdAt = data.createdAt?.toDate() || now;

      if (softwareId) {
        downloadsMonth[softwareId] = (downloadsMonth[softwareId] || 0) + 1;
        if (createdAt >= oneWeekAgo) {
          downloadsWeek[softwareId] = (downloadsWeek[softwareId] || 0) + 1;
        }
      }
    });

    const calculateForPeriod = (period: 'week' | 'month') => {
      const periodDownloads = period === 'week' ? downloadsWeek : downloadsMonth;

      const results: any[] = [];

      softwareSnap.docs.forEach(doc => {
        const sw = doc.data();
        const softwareId = doc.id;

        // Downloads Score (40%)
        const recentDl = periodDownloads[softwareId] || 0;
        const downloadsScore = recentDl > 0 
          ? Math.min(100, recentDl * (period === 'week' ? 10 : 3)) 
          : Math.min(100, Math.log10((sw.downloadCount || 0) + 1) * 20);

        // Ratings Score (25%)
        const ratingsScore = (sw.ratingAverage || 0) * 20;

        // Maintenance Score (15%)
        const updatedAt = sw.updatedAt?.toDate() || sw.publishedAt?.toDate() || now;
        const daysSinceUpdate = Math.max(0, (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
        const maintenanceScore = Math.max(0, 100 - daysSinceUpdate * 0.5);

        // Active Users Score (10%)
        const activeUsersScore = Math.min(100, (sw.followerCount || 0) * 10);

        // Documentation Score (10%)
        const descriptionLength = (sw.description || '').length;
        const hasRepo = !!sw.repositoryURL;
        const hasWeb = !!sw.websiteURL;
        const hasScreenshots = Array.isArray(sw.screenshotPaths) && sw.screenshotPaths.length > 0;
        const documentationScore = (hasRepo ? 30 : 0) + (hasWeb ? 20 : 0) + (descriptionLength > 500 ? 30 : 0) + (hasScreenshots ? 20 : 0);

        // Final Score
        const score = downloadsScore * 0.40 + ratingsScore * 0.25 + maintenanceScore * 0.15 + activeUsersScore * 0.10 + documentationScore * 0.10;

        results.push({
          softwareId,
          score,
          name: sw.name || 'Untitled',
          slug: sw.slug || softwareId,
          logoPath: sw.logoPath,
          categoryName: sw.categoryName || 'General',
          ratingAverage: sw.ratingAverage || 0,
          downloadCount: sw.downloadCount || 0
        });
      });

      results.sort((a, b) => b.score - a.score);
      return results.slice(0, 20);
    };

    const topWeek = calculateForPeriod('week');
    const topMonth = calculateForPeriod('month');

    const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();

    await Promise.all([
      adminDb.collection('system_metrics').doc('trending_week').set({
        metric: 'trending_week',
        items: topWeek,
        calculatedAt: serverTimestamp
      }),
      adminDb.collection('system_metrics').doc('trending_month').set({
        metric: 'trending_month',
        items: topMonth,
        calculatedAt: serverTimestamp
      })
    ]);

    return successResponse({ success: true, message: 'Trending software metrics updated.' });
  } catch (error) {
    console.error('Error in calculate-trending route:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to calculate trending', ApiErrors.INTERNAL_ERROR.status);
  }
});
