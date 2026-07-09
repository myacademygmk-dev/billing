import { HTMLAttributes } from 'react';

import { cn } from '@/components/ui/cn';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  square?: boolean;
};

export function Card({ className, square, ...props }: CardProps) {
  return <div className={cn('glass-panel', square ? 'rounded-none' : 'rounded-xl', className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('border-b border-[var(--panel-line)] px-4 py-2.5 sm:px-5 sm:py-3', className)}
      {...props}
    />
  );
}

export function CardTitle({ className, as: Tag = 'h3', ...props }: HTMLAttributes<HTMLHeadingElement> & { as?: 'h2' | 'h3' | 'h4' }) {
  return <Tag className={cn('theme-heading text-sm font-semibold sm:text-base', className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-4 py-3 sm:px-5 sm:py-3.5', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center gap-3 border-t border-[var(--panel-line)] px-4 py-2.5 sm:px-5 sm:py-3', className)}
      {...props}
    />
  );
}
