import { cn } from '@/components/ui/cn';

type Props = {
  className?: string;
  variant?: 'text' | 'title' | 'card' | 'circle' | 'custom';
  lines?: number;
};

export function Skeleton({ className, variant = 'custom', lines = 1 }: Props) {
  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn('skeleton skeleton-text', i === lines - 1 && 'w-3/4')}
          />
        ))}
      </div>
    );
  }

  const variantClass = {
    text: 'skeleton skeleton-text w-full',
    title: 'skeleton skeleton-title',
    card: 'skeleton skeleton-card w-full',
    circle: 'skeleton rounded-full h-10 w-10',
    custom: 'skeleton',
  };

  return <div className={cn(variantClass[variant], className)} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('glass-panel rounded-2xl p-4 sm:p-6', className)}>
      <div className="space-y-3">
        <Skeleton variant="title" />
        <Skeleton variant="text" lines={2} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex gap-4 px-5 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 border-t border-[var(--panel-line)] px-5 py-3.5">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className={cn('h-4 flex-1', j === 0 && 'max-w-[120px]')} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonMetricCards({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-panel rounded-2xl p-5">
          <Skeleton className="h-3 w-20 mb-3" />
          <Skeleton className="h-7 w-28" />
        </div>
      ))}
    </div>
  );
}
