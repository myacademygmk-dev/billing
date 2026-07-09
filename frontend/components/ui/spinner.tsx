import { cn } from '@/components/ui/cn';

type Props = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

export function Spinner({ className, size = 'md' }: Props) {
  const sizeMap = {
    sm: 'h-3.5 w-3.5 border-[1.5px]',
    md: 'h-4 w-4 border-2',
    lg: 'h-6 w-6 border-2',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-[var(--panel-line)] border-t-[var(--accent)]',
        sizeMap[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
