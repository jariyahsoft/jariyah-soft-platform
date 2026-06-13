'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { ReviewItem } from '@/lib/reviews/types';
import type { SoftwareItem } from '@/lib/software/types';
import { ReviewForm } from '@/components/software/ReviewForm';
import { ReviewList } from '@/components/software/ReviewList';

interface SoftwareReviewsSectionProps {
  software: SoftwareItem;
  initialItems: ReviewItem[];
  initialHasMore: boolean;
}

export function SoftwareReviewsSection({ software, initialItems, initialHasMore }: SoftwareReviewsSectionProps) {
  const { user } = useAuth();
  const [existingReview, setExistingReview] = useState<ReviewItem | null>(null);

  return (
    <div className="space-y-6">
      <ReviewForm software={software} existingReview={existingReview} />
      <ReviewList
        softwareId={software.id}
        initialItems={initialItems}
        initialHasMore={initialHasMore}
        currentUserId={user?.uid ?? null}
        onExistingReviewChange={setExistingReview}
      />
    </div>
  );
}
