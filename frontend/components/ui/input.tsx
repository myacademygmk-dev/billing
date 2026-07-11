import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/components/ui/cn';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> & {
  error?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  wrapperClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ className, error, prefix, suffix, wrapperClassName, ...props }, ref) => {
    const inputEl = (
      <input
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${props.id || props.name}-error` : undefined}
        className={cn(
          'theme-field h-9 w-full rounded-full border px-3.5 text-sm outline-none transition-colors duration-150',
          'focus:border-[var(--field-focus-border)] focus:ring-2 focus:ring-[var(--field-focus-ring)]',
          'placeholder:text-[var(--field-placeholder)]',
          error && 'theme-field-error',
          prefix && 'pl-10',
          suffix && 'pr-10',
          className
        )}
        {...props}
      />
    );

    if (prefix || suffix || error) {
      return (
        <div className={cn('relative', wrapperClassName)}>
          {prefix && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--field-placeholder)]">
              {prefix}
            </div>
          )}
          {inputEl}
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--field-placeholder)]">
              {suffix}
            </div>
          )}
          {error && (
            <p
              id={`${props.id || props.name}-error`}
              className="mt-1.5 text-xs text-[var(--danger)]"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
      );
    }

    return inputEl;
  }
);

Input.displayName = 'Input';
