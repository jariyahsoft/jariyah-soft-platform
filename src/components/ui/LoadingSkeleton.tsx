import React from 'react';
import { Skeleton } from './Skeleton';
import { Card, CardContent } from './Card';

interface LoadingSkeletonProps {
  variant?: 'list' | 'grid' | 'profile' | 'table';
  count?: number;
  className?: string;
}

export function LoadingSkeleton({ variant = 'list', count = 3, className = '' }: LoadingSkeletonProps) {
  const items = Array.from({ length: count });

  if (variant === 'grid') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 ${className}`}>
        {items.map((_, i) => (
          <Card key={i} className="overflow-hidden">
            {/* Image placeholder */}
            <Skeleton variant="rectangle" className="h-44 w-full rounded-t-xl rounded-b-none" />
            <CardContent className="space-y-4">
              {/* Title */}
              <Skeleton variant="text" className="h-5 w-3/4" />
              {/* Subtitle / Desc */}
              <div className="space-y-2">
                <Skeleton variant="text" className="h-3 w-full" />
                <Skeleton variant="text" className="h-3 w-5/6" />
              </div>
              {/* Footer row */}
              <div className="flex items-center justify-between pt-2">
                <Skeleton variant="circle" className="h-8 w-8" />
                <Skeleton variant="text" className="h-4 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (variant === 'profile') {
    return (
      <Card className={`max-w-xl mx-auto ${className}`}>
        <CardContent className="flex flex-col items-center text-center space-y-6">
          <Skeleton variant="circle" className="h-24 w-24" />
          <div className="space-y-2 w-full flex flex-col items-center">
            <Skeleton variant="text" className="h-6 w-1/3" />
            <Skeleton variant="text" className="h-4 w-1/2" />
          </div>
          <div className="w-full space-y-3 pt-4 border-t border-text-secondary/5">
            <Skeleton variant="text" className="h-3.5 w-full" />
            <Skeleton variant="text" className="h-3.5 w-full" />
            <Skeleton variant="text" className="h-3.5 w-4/5" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`border border-text-secondary/10 rounded-xl overflow-hidden bg-bg-card ${className}`}>
        <div className="bg-bg-secondary px-6 py-4 border-b border-text-secondary/10 flex gap-4">
          <Skeleton variant="text" className="h-4 w-24" />
          <Skeleton variant="text" className="h-4 w-32" />
          <Skeleton variant="text" className="h-4 w-20" />
        </div>
        <div className="divide-y divide-text-secondary/5 px-6">
          {items.map((_, i) => (
            <div key={i} className="py-4 flex gap-4 items-center">
              <Skeleton variant="text" className="h-4 w-24" />
              <Skeleton variant="text" className="h-4 w-48" />
              <Skeleton variant="text" className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // List layout default
  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border border-text-secondary/10 rounded-xl bg-bg-card items-start">
          <Skeleton variant="circle" className="h-12 w-12" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton variant="text" className="h-4 w-1/4" />
            <Skeleton variant="text" className="h-3.5 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
