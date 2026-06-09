import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon = <Inbox className="h-12 w-12 text-text-secondary/50" />,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 border border-dashed border-text-secondary/25 rounded-2xl bg-bg-card/30 max-w-md mx-auto ${className}`}>
      <div className="mb-4 flex items-center justify-center p-4 bg-bg-secondary rounded-full border border-text-secondary/5">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-text-secondary max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button onClick={onAction} size="sm">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
