import { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/components/ui/cn';

export function Table({ className, ...props }: ComponentPropsWithoutRef<'table'>) {
  return <table className={cn('w-full text-sm text-[var(--text)]', className)} {...props} />;
}

export function THead({ className, ...props }: ComponentPropsWithoutRef<'thead'>) {
  return (
    <thead
      className={cn('sticky top-0 z-10 bg-[var(--table-head-bg)] backdrop-blur', className)}
      {...props}
    />
  );
}

export function TH({ className, ...props }: ComponentPropsWithoutRef<'th'>) {
  return (
    <th
      className={cn(
        'border-b border-[var(--panel-line)] px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)] sm:px-4 sm:py-2.5',
        className
      )}
      {...props}
    />
  );
}

export function TBody({ className, ...props }: ComponentPropsWithoutRef<'tbody'>) {
  return <tbody className={cn('', className)} {...props} />;
}

export function TR({ className, ...props }: ComponentPropsWithoutRef<'tr'>) {
  return (
    <tr
      className={cn(
        'transition-colors duration-100 hover:bg-[var(--table-row-hover)]',
        className
      )}
      {...props}
    />
  );
}

export function TD({ className, ...props }: ComponentPropsWithoutRef<'td'>) {
  return (
    <td
      className={cn(
        'border-b border-[rgba(148,163,184,0.08)] px-3 py-2 align-middle text-[var(--text)] sm:px-4 sm:py-2.5',
        className
      )}
      {...props}
    />
  );
}
