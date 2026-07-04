import { HTMLAttributes } from 'react';

import { cn } from '@/components/ui/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('glass-panel rounded-2xl', className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-b border-[rgba(148,163,184,0.12)] px-4 py-3 sm:px-6 sm:py-4', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('theme-heading text-base font-semibold sm:text-lg', className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-4 py-3 sm:px-6 sm:py-4', className)} {...props} />;
}
