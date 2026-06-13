'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ReviewItem } from '@/lib/reviews/types';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

interface ReviewListProps {
  softwareId: string;
  initialItems?: ReviewItem[];
  initialHasMore?: boolean;
  currentUserId?: string | null;
  onExistingReviewChange?: (review: ReviewItem | null) => void;
}

interface ReviewResponse {
  data?: {
    items?: ReviewItem[];
    hasMore?: boolean;
    existingReview?: ReviewItem | null;
  };
}

export function ReviewList({
  softwareId,
  initialItems = [],
  initialHasMore = false,
  currentUserId,
  onExistingReviewChange,
}: ReviewListProps) {
  const t = useTranslations('software');
  const locale = useLocale();
  const [items, setItems] = useState(initialItems);
  const [sort, setSort] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_API_KEY ?? 'dev-api-key';

  useEffect(() => {
    setItems(initialItems);
    setHasMore(initialHasMore);
    setPage(1);
  }, [initialHasMore, initialItems]);

  useEffect(() => {
    if (!currentUserId) return;
    void loadReviews(1, sort, false);
    // We only need the initial hydration fetch when the current user changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  async function loadReviews(nextPage: number, nextSort: typeof sort, append: boolean) {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '5',
        page: String(nextPage),
        sort: nextSort,
      });

      if (currentUserId) params.set('userId', currentUserId);

      const response = await fetch(`/api/v1/software/${softwareId}/review?${params.toString()}`, {
        headers: {
          'X-API-Key': apiKey,
        },
      });

      const payload = (await response.json().catch(() => null)) as ReviewResponse | null;
      if (!response.ok) {
        throw new Error(t('reviews.list.loadError'));
      }

      const nextItems = payload?.data?.items ?? [];
      setItems((current) => (append ? [...current, ...nextItems] : nextItems));
      setHasMore(Boolean(payload?.data?.hasMore));
      onExistingReviewChange?.(payload?.data?.existingReview ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSortChange(value: 'newest' | 'highest' | 'lowest') {
    setSort(value);
    setPage(1);
    await loadReviews(1, value, false);
  }

  async function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    await loadReviews(nextPage, sort, true);
  }

  if (items.length === 0) {
    return <div className="rounded-2xl border border-dashed border-text-secondary/20 p-6 text-sm text-text-secondary">{t('reviews.list.empty')}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-bold text-text-primary">{t('reviews.list.title')}</h3>
        <div className="w-full max-w-[220px]">
          <Select
            label={t('reviews.list.sortLabel')}
            value={sort}
            onChange={(event) => void handleSortChange(event.target.value as typeof sort)}
            options={[
              { value: 'newest', label: t('reviews.list.sortNewest') },
              { value: 'highest', label: t('reviews.list.sortHighest') },
              { value: 'lowest', label: t('reviews.list.sortLowest') },
            ]}
          />
        </div>
      </div>

      <div className="space-y-4">
        {items.map((review) => (
          <article key={review.id} className="rounded-3xl border border-text-secondary/10 bg-bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 font-bold text-accent">
                  {review.userAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={review.userAvatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                  ) : (
                    review.userName.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="font-semibold text-text-primary">{review.userName}</div>
                  <div className="text-xs text-text-secondary">
                    {review.updatedAt
                      ? new Date(review.updatedAt).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US')
                      : t('reviews.list.unknownDate')}
                  </div>
                </div>
              </div>
              <div className="inline-flex items-center gap-1 font-semibold text-text-primary">
                <Star className="h-4 w-4 fill-warning text-warning" />
                {review.rating.toFixed(1)}
              </div>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-text-secondary">{review.body}</p>
          </article>
        ))}
      </div>

      {hasMore ? (
        <div className="flex justify-center">
          <Button variant="outline" loading={loading} onClick={() => void handleLoadMore()}>
            {t('reviews.list.loadMore')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
