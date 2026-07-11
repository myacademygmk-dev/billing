import { HTMLAttributes } from 'react';

import { cn } from '@/components/ui/cn';

type Props = HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'accent';
};

export function Badge({ className, variant = 'default', ...props }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium',
        variant === 'default' && 'theme-chip-neutral',
        variant === 'success' && 'theme-chip-success',
        variant === 'warning' && 'theme-chip-warn',
        variant === 'danger' && 'theme-chip-danger',
        variant === 'accent' && 'bg-[var(--accent-soft)] text-[var(--accent)]',
        className
      )}
      {...props}
    />
  );
}
