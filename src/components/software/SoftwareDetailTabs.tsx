'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import { SoftwareItem } from '@/lib/software/types';
import type { ReviewItem } from '@/lib/reviews/types';
import { SoftwareReviewsSection } from '@/components/software/SoftwareReviewsSection';

interface SoftwareDetailTabsProps {
  software: SoftwareItem;
  initialReviews: ReviewItem[];
  initialHasMoreReviews: boolean;
}

const tabs = ['overview', 'changelog', 'reviews'] as const;

export function SoftwareDetailTabs({ software, initialReviews, initialHasMoreReviews }: SoftwareDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('overview');
  const t = useTranslations('software');

  return (
    <section className="rounded-3xl border border-text-secondary/10 bg-bg-card p-4 md:p-6">
      <div className="flex flex-wrap gap-2 border-b border-text-secondary/10 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
              activeTab === tab
                ? 'bg-accent text-white shadow-sm shadow-accent/20'
                : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab === 'overview'
              ? t('detail.overview')
              : tab === 'changelog'
                ? t('detail.changelog')
                : t('detail.reviews')}
          </button>
        ))}
      </div>

      <div className="pt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">{t('detail.overview')}</h2>
              <p className="mt-3 whitespace-pre-wrap leading-8 text-text-secondary">{software.description}</p>
            </div>
            <div>
              <h3 className="text-lg font-bold">{t('detail.screenshots')}</h3>
              {software.screenshotPaths.length > 0 ? (
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {software.screenshotPaths.map((src) => (
                    <div key={src} className="overflow-hidden rounded-2xl border border-text-secondary/10 bg-bg-secondary">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`${software.name} screenshot`} className="aspect-video w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-2xl border border-dashed border-text-secondary/20 bg-bg-secondary p-8 text-sm text-text-secondary">
                  {t('detail.screenshotsEmpty')}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'changelog' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold">{t('detail.changelog')}</h2>
              <p className="mt-3 leading-8 text-text-secondary">
                {software.releaseNotes ?? t('detail.changelogEmpty')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {software.tagIds.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <h2 className="text-2xl font-bold">{t('detail.reviews')}</h2>
            <p className="mt-3 text-text-secondary">
              {software.ratingCount > 0
                ? t('reviews.summary', {
                    count: software.ratingCount,
                    rating: software.ratingAverage.toFixed(1),
                  })
                : t('reviews.emptySummary')}
            </p>
            <div className="mt-6">
              <SoftwareReviewsSection
                software={software}
                initialItems={initialReviews}
                initialHasMore={initialHasMoreReviews}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
