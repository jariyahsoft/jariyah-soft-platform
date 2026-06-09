import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'bronze'
    | 'silver'
    | 'gold'
    | 'platinum'
    | 'elite';
  size?: 'sm' | 'md';
}

export function Badge({ className = '', variant = 'default', size = 'sm', children, ...props }: BadgeProps) {
  const baseStyle =
    'inline-flex items-center justify-center font-semibold rounded-full tracking-wide uppercase select-none transition-colors duration-200';

  const variants = {
    default: 'bg-bg-secondary text-text-primary border border-text-secondary/15',
    success: 'bg-success/10 text-success border border-success/20 dark:bg-success/15',
    warning: 'bg-warning/10 text-warning border border-warning/20 dark:bg-warning/15',
    danger: 'bg-danger/10 text-danger border border-danger/20 dark:bg-danger/15',
    info: 'bg-accent/10 text-accent border border-accent/20 dark:bg-accent/15',

    // Design Tokens Tier Badges
    bronze: 'bg-badge-bronze/10 text-badge-bronze border border-badge-bronze/35 dark:bg-badge-bronze/20',
    silver: 'bg-badge-silver/10 text-badge-silver border border-badge-silver/35 dark:bg-badge-silver/20',
    gold: 'bg-badge-gold/10 text-badge-gold border border-badge-gold/35 dark:bg-badge-gold/20',
    platinum: 'bg-badge-platinum/10 text-badge-platinum border border-badge-platinum/35 dark:bg-badge-platinum/20',
    elite: 'bg-badge-elite/10 text-badge-elite border border-badge-elite/35 dark:bg-badge-elite/20',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </span>
  );
}
