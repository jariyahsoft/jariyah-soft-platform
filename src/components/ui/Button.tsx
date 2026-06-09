import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    // Base styles with focus ring and smooth hover transition
    const baseStyle =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none';

    // Variant classes mapping to design tokens
    const variants = {
      primary: 'bg-accent hover:bg-accent-hover text-white shadow-md shadow-accent/10',
      secondary: 'bg-bg-secondary hover:bg-bg-secondary/80 text-text-primary border border-text-secondary/15',
      outline: 'bg-transparent border border-text-secondary/30 hover:border-text-secondary text-text-primary hover:bg-text-secondary/5',
      ghost: 'bg-transparent hover:bg-text-secondary/10 text-text-primary',
      danger: 'bg-danger hover:bg-danger/90 text-white shadow-md shadow-danger/10 focus-visible:ring-danger',
    };

    // Size classes mapping
    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const isPending = loading || disabled;

    return (
      <button
        ref={ref}
        disabled={isPending}
        className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
