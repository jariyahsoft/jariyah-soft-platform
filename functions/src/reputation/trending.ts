import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';

export const runTrendingCalculation = async () => {
  const db = admin.firestore();
  
  // Fetch all published software
  const softwareSnap = await db.collection('software')
    .where('status', '==', 'published')
    .get();

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Fetch all downloads from last 30 days to count them per software (covers both week and month)
  const downloadsSnap = await db.collection('downloads')
    .where('createdAt', '>=', oneMonthAgo)
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

    const results: { softwareId: string; score: number; name: string; slug: string; logoPath?: string; categoryName: string; ratingAverage: number; downloadCount: number }[] = [];

    softwareSnap.docs.forEach(doc => {
      const sw = doc.data();
      const softwareId = doc.id;

      // 1. Downloads Score (40%)
      const recentDl = periodDownloads[softwareId] || 0;
      const downloadsScore = recentDl > 0 
        ? Math.min(100, recentDl * (period === 'week' ? 10 : 3)) 
        : Math.min(100, Math.log10((sw.downloadCount || 0) + 1) * 20);

      // 2. Ratings Score (25%)
      const ratingsScore = (sw.ratingAverage || 0) * 20;

      // 3. Maintenance Score (15%)
      const updatedAt = sw.updatedAt?.toDate() || sw.publishedAt?.toDate() || now;
      const daysSinceUpdate = Math.max(0, (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
      const maintenanceScore = Math.max(0, 100 - daysSinceUpdate * 0.5);

      // 4. Active Users Score (10%)
      const activeUsersScore = Math.min(100, (sw.followerCount || 0) * 10);

      // 5. Documentation Score (10%)
      const descriptionLength = (sw.description || '').length;
      const hasRepo = !!sw.repositoryURL;
      const hasWeb = !!sw.websiteURL;
      const hasScreenshots = Array.isArray(sw.screenshotPaths) && sw.screenshotPaths.length > 0;
      const documentationScore = (hasRepo ? 30 : 0) + (hasWeb ? 20 : 0) + (descriptionLength > 500 ? 30 : 0) + (hasScreenshots ? 20 : 0);

      // Final Weighted Score
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

  // Store in system_metrics
  const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();
  
  await Promise.all([
    db.collection('system_metrics').doc('trending_week').set({
      metric: 'trending_week',
      items: topWeek,
      calculatedAt: serverTimestamp
    }),
    db.collection('system_metrics').doc('trending_month').set({
      metric: 'trending_month',
      items: topMonth,
      calculatedAt: serverTimestamp
    })
  ]);
};

// Daily scheduled function
export const calculateTrendingDaily = onSchedule('every 24 hours', async (event) => {
  console.log('Running daily scheduled trending calculation...');
  await runTrendingCalculation();
  console.log('Daily trending calculation completed successfully.');
});
