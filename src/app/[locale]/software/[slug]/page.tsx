import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Award, Code, ExternalLink, Globe, Share2, ShieldCheck, Star } from 'lucide-react';
import { DownloadButton } from '@/components/software/DownloadButton';
import { SoftwareDetailTabs } from '@/components/software/SoftwareDetailTabs';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getPublishedSoftwareBySlug } from '@/lib/software/data';
import { PLATFORM_LABELS } from '@/lib/software/types';
import { listApprovedReviewsForSoftware } from '@/lib/reviews/data';

export const revalidate = 300;

interface SoftwareDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: SoftwareDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const software = await getPublishedSoftwareBySlug(slug);

  if (!software) {
    return {
      title: 'Software not found | Jariyah Soft',
    };
  }

  return {
    title: `${software.name} | Jariyah Soft`,
    description: software.shortDescription,
    openGraph: {
      title: software.name,
      description: software.shortDescription,
      images: software.logoPath ? [software.logoPath] : ['/opengraph-image.png'],
    },
  };
}

export default async function SoftwareDetailPage({ params }: SoftwareDetailPageProps) {
  const { locale, slug } = await params;
  const software = await getPublishedSoftwareBySlug(slug);
  const t = await getTranslations({ locale, namespace: 'software' });

  if (!software) notFound();

  const initialReviews = await listApprovedReviewsForSoftware(software.id, { limit: 5, page: 1, sort: 'newest' });

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: software.name,
    description: software.shortDescription,
    applicationCategory: software.categoryName,
    operatingSystem: software.platforms.map((platform) => PLATFORM_LABELS[platform] ?? platform).join(', '),
    aggregateRating:
      software.ratingCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: software.ratingAverage,
            ratingCount: software.ratingCount,
          }
        : undefined,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  /** Certification badge display config */
  const certBadges: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
    verified: {
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
      label: 'Verified',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    },
    security_checked: {
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
      label: 'Security Checked',
      className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    },
    editors_choice: {
      icon: <Award className="h-3.5 w-3.5" />,
      label: "Editor's Choice",
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    },
    open_source_verified: {
      icon: <Globe className="h-3.5 w-3.5" />,
      label: 'Open Source Verified',
      className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    },
    community_recommended: {
      icon: <Star className="h-3.5 w-3.5" />,
      label: 'Community Recommended',
      className: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
    },
  };

  const activeCerts = software.certifications || [];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(0,120,255,0.16),transparent_34rem)] px-4 py-10 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="mx-auto max-w-7xl">
        <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="rounded-[2rem] border border-text-secondary/10 bg-bg-card p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/25 to-bg-secondary text-4xl font-black text-accent">
                {software.logoPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={software.logoPath} alt="" className="h-full w-full rounded-3xl object-cover" />
                ) : (
                  software.name.slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="info">{software.categoryName}</Badge>
                  <Badge variant="success">{t('status.published')}</Badge>
                </div>
                <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">{software.name}</h1>
                {/* Certification Badges */}
                {activeCerts.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeCerts.map((cert) => {
                      const config = certBadges[cert];
                      if (!config) return null;
                      return (
                        <span
                          key={cert}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}
                        >
                          {config.icon}
                          {config.label}
                        </span>
                      );
                    })}
                  </div>
                )}
                <p className="mt-2 text-lg text-text-secondary">{t('detail.byDeveloper', { name: software.developerName })}</p>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-text-secondary">{software.shortDescription}</p>
                <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                  <span className="inline-flex items-center gap-1 font-bold text-text-primary">
                    <Star className="h-5 w-5 fill-warning text-warning" />
                    {t('reviews.ratingHeadline', {
                      rating: software.ratingAverage.toFixed(1),
                      count: software.ratingCount,
                    })}
                  </span>
                  <span>{t('card.downloads', { count: software.downloadCount.toLocaleString() })}</span>
                  {software.latestVersion && <span>{t('card.version', { version: software.latestVersion })}</span>}
                </div>
                <div className="mt-7 flex flex-wrap gap-3">
                  <DownloadButton softwareId={software.id} />
                  {software.repositoryURL && (
                    <a href={software.repositoryURL} target="_blank" rel="noreferrer">
                      <Button variant="secondary" size="lg">
                        <Code className="mr-2 h-5 w-5" />
                        {t('detail.repository')}
                      </Button>
                    </a>
                  )}
                  {software.websiteURL && (
                    <a href={software.websiteURL} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="lg">
                        <ExternalLink className="mr-2 h-5 w-5" />
                        {t('detail.visitWebsite')}
                      </Button>
                    </a>
                  )}
                  <Button variant="ghost" size="lg">
                    <Share2 className="mr-2 h-5 w-5" />
                    {t('detail.share')}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-text-secondary/10 bg-bg-card p-6">
            <h2 className="text-lg font-bold">{t('detail.releaseDetails')}</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-text-secondary">{t('detail.platforms')}</dt>
                <dd className="mt-1 flex flex-wrap gap-2">
                  {software.platforms.map((platform) => (
                    <Badge key={platform}>{PLATFORM_LABELS[platform] ?? platform}</Badge>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-text-secondary">{t('detail.license')}</dt>
                <dd className="mt-1 text-text-primary">{software.licenseName}</dd>
              </div>
              <div>
                <dt className="font-semibold text-text-secondary">{t('detail.updated')}</dt>
                <dd className="mt-1 text-text-primary">
                  {software.updatedAt ? new Date(software.updatedAt).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US') : t('detail.unknown')}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-text-secondary">{t('detail.fileSize')}</dt>
                <dd className="mt-1 text-text-primary">{software.fileSize ?? t('detail.notProvided')}</dd>
              </div>
              {activeCerts.length > 0 && (
                <div>
                  <dt className="font-semibold text-text-secondary">Certifications</dt>
                  <dd className="mt-2 flex flex-wrap gap-1.5">
                    {activeCerts.map((cert) => {
                      const config = certBadges[cert];
                      if (!config) return null;
                      return (
                        <span
                          key={cert}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${config.className}`}
                        >
                          {config.icon}
                          {config.label}
                        </span>
                      );
                    })}
                  </dd>
                </div>
              )}
            </dl>
          </aside>
        </section>

        <div className="mt-6">
          <SoftwareDetailTabs
            software={software}
            initialReviews={initialReviews.items}
            initialHasMoreReviews={initialReviews.hasMore}
          />
        </div>
      </div>
    </main>
  );
}
