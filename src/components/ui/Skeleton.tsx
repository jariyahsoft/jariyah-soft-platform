import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circle' | 'rectangle';
}

export function Skeleton({ className = '', variant = 'rectangle', ...props }: SkeletonProps) {
  const baseStyle = 'animate-pulse bg-text-secondary/15 rounded';

  const variants = {
    text: 'h-3.5 w-full rounded-md',
    circle: 'rounded-full shrink-0',
    rectangle: 'w-full rounded-lg',
  };

  return (
    <div
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
