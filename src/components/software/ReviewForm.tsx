'use client';

import { useEffect, useState, useTransition } from 'react';
import { AlertCircle, CheckCircle2, Star } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/i18n/routing';
import type { ReviewItem } from '@/lib/reviews/types';
import type { SoftwareItem } from '@/lib/software/types';
import { Button } from '@/components/ui/Button';

interface ReviewFormProps {
  software: SoftwareItem;
  existingReview?: ReviewItem | null;
}

export function ReviewForm({ software, existingReview }: ReviewFormProps) {
  const t = useTranslations('software');
  const locale = useLocale();
  const router = useRouter();
  const { user, loading, isAuthenticated, isAtLeast } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [body, setBody] = useState(existingReview?.body ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRating(existingReview?.rating ?? 0);
    setBody(existingReview?.body ?? '');
  }, [existingReview]);

  const isOwner = !!user && software.ownerId === user.uid;
  const canReview = isAuthenticated && isAtLeast('member') && !isOwner;

  function submitReview() {
    startTransition(async () => {
      try {
        if (!user) {
          router.push('/login');
          return;
        }

        setError(null);
        setMessage(null);

        const token = await user.getIdToken();
        const response = await fetch(`/api/v1/software/${software.id}/review`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rating, body }),
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error?.message ?? t('reviews.form.submitError'));
        }

        setMessage(existingReview ? t('reviews.form.updatedSuccess') : t('reviews.form.createdSuccess'));
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : t('reviews.form.submitError'));
      }
    });
  }

  if (loading) {
    return <div className="rounded-2xl bg-bg-secondary p-4 text-sm text-text-secondary">{t('reviews.form.checkingAccess')}</div>;
  }

  if (isOwner) {
    return (
      <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4 text-sm text-warning">
        {t('reviews.form.selfReviewBlocked')}
      </div>
    );
  }

  if (!isAuthenticated || !isAtLeast('member')) {
    return (
      <div className="rounded-2xl border border-text-secondary/15 bg-bg-secondary p-4 text-sm text-text-secondary">
        {t('reviews.form.authRequired')}
      </div>
    );
  }

  const rejectionNote = existingReview?.status === 'rejected' ? existingReview.moderationReason?.note : null;

  return (
    <div className="space-y-4 rounded-3xl border border-text-secondary/10 bg-bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-text-primary">
            {existingReview ? t('reviews.form.editTitle') : t('reviews.form.title')}
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            {existingReview ? t('reviews.form.editSubtitle') : t('reviews.form.subtitle')}
          </p>
        </div>
        {existingReview ? (
          <span className="rounded-full bg-bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            {existingReview.status}
          </span>
        ) : null}
      </div>

      {rejectionNote ? (
        <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4 text-sm text-warning">
          {t('reviews.form.rejectionReason', { reason: rejectionNote })}
        </div>
      ) : null}

      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-text-primary/80">{t('reviews.form.ratingLabel')}</div>
        <div className="mt-2 flex items-center gap-2">
          {Array.from({ length: 5 }, (_, index) => {
            const value = index + 1;
            const active = value <= rating;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className={`rounded-full p-2 transition ${active ? 'text-warning' : 'text-text-secondary hover:text-warning'}`}
                aria-label={t('reviews.form.starLabel', { count: value })}
              >
                <Star className={`h-6 w-6 ${active ? 'fill-warning' : ''}`} />
              </button>
            );
          })}
          <span className="text-sm text-text-secondary">
            {rating > 0 ? t('reviews.form.ratingValue', { count: rating }) : t('reviews.form.ratingHint')}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary/80" htmlFor="review-body">
          {t('reviews.form.bodyLabel')}
        </label>
        <textarea
          id="review-body"
          value={body}
          rows={6}
          onChange={(event) => setBody(event.target.value)}
          className="w-full rounded-lg border border-text-secondary/15 bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
          placeholder={t('reviews.form.bodyPlaceholder')}
        />
        <div className="flex justify-between text-xs text-text-secondary">
          <span>{t('reviews.form.bodyHint')}</span>
          <span>{body.length}/2000</span>
        </div>
      </div>

      {(message || error) ? (
        <div className={`flex gap-3 rounded-2xl p-4 text-sm ${error ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
          {error ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0" />}
          <span>{error ?? message}</span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={submitReview} loading={isPending} disabled={!canReview || rating < 1 || body.trim().length < 20}>
          {existingReview ? t('reviews.form.updateButton') : t('reviews.form.submitButton')}
        </Button>
        <span className="text-xs text-text-secondary">
          {locale === 'th' ? 'รีวิวใหม่และรีวิวที่แก้ไขจะกลับเข้าสู่คิว moderation' : 'New and edited reviews return to moderation.'}
        </span>
      </div>
    </div>
  );
}
