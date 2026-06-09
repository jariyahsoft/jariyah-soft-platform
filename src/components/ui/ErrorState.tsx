'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title,
  message,
  onRetry,
  retryLabel,
  className = '',
}: ErrorStateProps) {
  const tErrors = useTranslations('errors');
  const tActions = useTranslations('actions');

  const displayTitle = title || tErrors('generic');
  const displayMessage = message || tErrors('networkError');
  const displayRetryLabel = retryLabel || tActions('retry');

  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 border border-danger/10 rounded-2xl bg-danger/5 max-w-md mx-auto ${className}`}>
      <div className="mb-4 flex items-center justify-center p-3.5 bg-danger/10 text-danger rounded-full">
        <AlertTriangle className="h-10 w-10" />
      </div>
      <h3 className="text-base font-semibold text-text-primary">{displayTitle}</h3>
      <p className="mt-1.5 text-sm text-text-secondary max-w-xs leading-relaxed">
        {displayMessage}
      </p>
      {onRetry && (
        <div className="mt-5">
          <Button onClick={onRetry} variant="danger" size="sm">
            {displayRetryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
