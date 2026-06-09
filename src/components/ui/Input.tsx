import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, helperText, error, iconLeft, iconRight, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-text-primary/80"
          >
            {label}
          </label>
        )}

        <div className="relative rounded-lg shadow-sm">
          {iconLeft && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary select-none">
              {iconLeft}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`w-full bg-bg-secondary text-text-primary border rounded-lg px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent disabled:opacity-50 disabled:bg-bg-secondary/50 placeholder:text-text-secondary/60 ${
              error ? 'border-danger focus:ring-danger/40 focus:border-danger' : 'border-text-secondary/15 hover:border-text-secondary/35'
            } ${iconLeft ? 'pl-10' : ''} ${iconRight ? 'pr-10' : ''} ${className}`}
            {...props}
          />

          {iconRight && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-secondary select-none">
              {iconRight}
            </div>
          )}
        </div>

        {error ? (
          <p id={errorId} className="text-xs text-danger font-medium animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-text-secondary">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
