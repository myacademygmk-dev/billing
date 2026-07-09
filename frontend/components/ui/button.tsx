import { ButtonHTMLAttributes, forwardRef } from 'react';

import { cn } from '@/components/ui/cn';
import { Spinner } from '@/components/ui/spinner';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = 'default', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50',
          // Border radius
          'rounded-full',
          // Sizes
          size === 'sm' && 'h-7 px-3 text-xs',
          size === 'md' && 'h-[34px] px-3.5 text-sm',
          size === 'lg' && 'h-10 px-5 text-sm',
          size === 'icon' && 'h-8 w-8 text-sm',
          // Variants
          variant === 'default' &&
            'border border-transparent bg-[var(--accent)] text-white shadow-[0_4px_12px_rgba(79,140,255,0.2)] hover:bg-[var(--accent-hover)] hover:shadow-[0_6px_16px_rgba(79,140,255,0.25)] active:scale-[0.98]',
          variant === 'secondary' &&
            'border border-[var(--accent-soft)] bg-[var(--accent-soft)] text-[var(--heading)] hover:bg-[rgba(47,111,237,0.18)] active:scale-[0.98]',
          variant === 'outline' &&
            'border border-[var(--field-border)] bg-[var(--field-bg)] text-[var(--text)] hover:border-[var(--panel-line)] hover:bg-[var(--surface-subtle)] active:scale-[0.98]',
          variant === 'ghost' &&
            'border border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text)]',
          variant === 'destructive' &&
            'border border-transparent bg-[var(--danger)] text-white shadow-[0_4px_12px_rgba(194,65,87,0.2)] hover:bg-[var(--danger-hover)] hover:shadow-[0_6px_16px_rgba(194,65,87,0.25)] active:scale-[0.98]',
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Spinner className="h-4 w-4" />
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
