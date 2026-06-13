import React from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { adminDb } from '@/lib/firebase/admin';
import { Flame, Star, Download, TrendingUp, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface TrendingPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ period?: string }>;
}

export const revalidate = 60; // Cache for 60 seconds

export default async function TrendingPage({ params, searchParams }: TrendingPageProps) {
  const { locale } = await params;
  const { period = 'week' } = await searchParams;
  const activePeriod = period === 'month' ? 'month' : 'week';

  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const tSoftware = await getTranslations({ locale, namespace: 'software' });

  // 1. Fetch system metrics document
  const metricDocName = `trending_${activePeriod}`;
  const metricSnap = await adminDb.collection('system_metrics').doc(metricDocName).get();
  
  const metricData = metricSnap.exists ? metricSnap.data() : null;
  const items: any[] = metricData?.items || [];
  const calculatedAt = metricData?.calculatedAt 
    ? metricData.calculatedAt.toDate().toLocaleString(locale === 'th' ? 'th-TH' : 'en-US') 
    : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.08),transparent_35rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* Page Header and Period Selector */}
        <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-text-secondary/10 pb-6">
          <div className="space-y-2">
            <Badge variant="warning" size="md" className="inline-flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-warning fill-warning animate-pulse" />
              <span>Trending</span>
            </Badge>
            <h1 className="text-4xl font-black tracking-tight text-text-primary md:text-5xl">
              {locale === 'th' ? 'ซอฟต์แวร์ยอดนิยม' : 'Trending Software'}
            </h1>
            <p className="max-w-2xl text-sm text-text-secondary">
              {locale === 'th'
                ? 'ค้นพบซอฟต์แวร์ที่มาแรงที่สุด จัดอันดับด้วยสูตรคำนวณการดาวน์โหลด เรตติ้ง การอัปเดต และการใช้งานของชุมชน'
                : 'Discover the hottest software, ranked by recent downloads, user ratings, active community engagement, and maintenance.'}
            </p>
          </div>

          {/* Period Selector Tabs */}
          <div className="flex rounded-xl bg-bg-secondary p-1 border border-text-secondary/5 self-start md:self-auto shadow-sm">
            <Link
              href={`/trending?period=week`}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                activePeriod === 'week'
                  ? 'bg-bg-card text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {locale === 'th' ? 'สัปดาห์นี้' : 'This Week'}
            </Link>
            <Link
              href={`/trending?period=month`}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                activePeriod === 'month'
                  ? 'bg-bg-card text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {locale === 'th' ? 'เดือนนี้' : 'This Month'}
            </Link>
          </div>
        </section>

        {/* Trending list / grid */}
        {items.length === 0 ? (
          <div className="rounded-3xl border border-text-secondary/10 bg-bg-card p-16 text-center space-y-4 shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/10 text-warning">
              <TrendingUp className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">
              {locale === 'th' ? 'ไม่พบข้อมูลจัดอันดับในขณะนี้' : 'No Trending Data Available Yet'}
            </h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
              {locale === 'th'
                ? 'ระบบประมวลผลความนิยมรายวันกำลังเตรียมคำนวณข้อมูล กรุณากลับมาตรวจสอบอีกครั้งภายหลัง'
                : 'The daily trending job is processing stats. Please check back shortly.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Top 3 Spotlight Section */}
            <div className="grid gap-6 md:grid-cols-3">
              {items.slice(0, 3).map((item, index) => {
                const rankColors = [
                  'border-warning/30 bg-[linear-gradient(135deg,rgba(251,191,36,0.04),transparent_50%)] ring-2 ring-warning/20',
                  'border-slate-300 bg-[linear-gradient(135deg,rgba(148,163,184,0.04),transparent_50%)] ring-2 ring-slate-400/20',
                  'border-amber-600 bg-[linear-gradient(135deg,rgba(217,119,6,0.04),transparent_50%)] ring-2 ring-amber-700/20'
                ];

                const badgeColors = [
                  'bg-warning/10 text-warning border-warning/20',
                  'bg-slate-400/10 text-slate-500 border-slate-400/20',
                  'bg-amber-600/10 text-amber-700 border-amber-600/20'
                ];

                return (
                  <div 
                    key={item.softwareId}
                    className={`relative flex flex-col justify-between rounded-3xl border p-6 md:p-8 bg-bg-card hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ${rankColors[index]}`}
                  >
                    {/* Rank Badge */}
                    <div className="absolute top-4 right-4 flex items-center justify-center h-8 w-8 rounded-full border text-xs font-black shadow-sm bg-bg-card">
                      <span className={`flex items-center justify-center rounded-full h-full w-full font-black ${badgeColors[index]}`}>
                        #{index + 1}
                      </span>
                    </div>

                    <div className="space-y-5">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/10 bg-accent/5 text-xl font-black text-accent shadow-sm">
                        {item.logoPath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.logoPath} alt="" className="h-full w-full rounded-2xl object-cover" />
                        ) : (
                          item.name.slice(0, 1).toUpperCase()
                        )}
                      </div>

                      <div className="space-y-1">
                        <Badge variant="info" size="sm">{item.categoryName}</Badge>
                        <h3 className="text-xl font-bold tracking-tight text-text-primary pt-1">
                          <Link href={`/software/${item.slug}`} className="hover:text-accent transition-colors">
                            {item.name}
                          </Link>
                        </h3>
                        <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                          {item.shortDescription || tSoftware('card.downloadCount') || 'Software description is not provided.'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-text-secondary/5 pt-4 text-xs font-medium text-text-secondary">
                      <span className="inline-flex items-center gap-1 text-text-primary font-bold">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        {Number(item.ratingAverage || 0).toFixed(1)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        {Number(item.downloadCount || 0).toLocaleString()} DL
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ranks 4-20 List Section */}
            {items.length > 3 && (
              <div className="rounded-3xl border border-text-secondary/10 bg-bg-card divide-y divide-text-secondary/5 overflow-hidden shadow-sm">
                {items.slice(3).map((item, index) => {
                  const rank = index + 4;
                  return (
                    <div 
                      key={item.softwareId}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 hover:bg-text-secondary/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank Number */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bg-secondary text-sm font-black text-text-secondary border border-text-secondary/10">
                          #{rank}
                        </div>

                        {/* Software Logo & Name */}
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-text-secondary/10 bg-bg-secondary font-bold text-text-secondary">
                          {item.logoPath ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.logoPath} alt="" className="h-full w-full rounded-xl object-cover" />
                          ) : (
                            item.name.slice(0, 1).toUpperCase()
                          )}
                        </div>

                        <div>
                          <h4 className="font-bold text-text-primary hover:text-accent transition-colors duration-200">
                            <Link href={`/software/${item.slug}`}>{item.name}</Link>
                          </h4>
                          <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">
                            {item.categoryName}
                          </p>
                        </div>
                      </div>

                      {/* Performance stats */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 text-xs text-text-secondary sm:text-right">
                        <div className="flex items-center gap-4">
                          <span className="inline-flex items-center gap-1 font-bold text-text-primary">
                            <Star className="h-4 w-4 fill-warning text-warning" />
                            {Number(item.ratingAverage || 0).toFixed(1)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Download className="h-4 w-4" />
                            {Number(item.downloadCount || 0).toLocaleString()} DL
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-full bg-warning/10 text-warning px-2.5 py-1 text-[10px] font-bold border border-warning/10" title={`Trending score: ${item.score.toFixed(1)}`}>
                          <Sparkles className="h-3 w-3" />
                          Trending
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Calculated Timestamp footer */}
            {calculatedAt && (
              <p className="text-center text-[10px] text-text-secondary pt-2">
                {locale === 'th' 
                  ? `อัปเดตข้อมูลล่าสุดเมื่อ: ${calculatedAt}` 
                  : `Last updated: ${calculatedAt}`}
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
