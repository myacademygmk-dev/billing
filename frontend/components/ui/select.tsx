import { forwardRef, SelectHTMLAttributes } from 'react';

import { cn } from '@/components/ui/cn';

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, Props>(({ className, error, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        className={cn(
          'theme-select w-full appearance-none pr-10 transition-colors duration-150',
          'focus:border-[var(--field-focus-border)] focus:ring-2 focus:ring-[var(--field-focus-ring)]',
          error && 'theme-field-error',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
