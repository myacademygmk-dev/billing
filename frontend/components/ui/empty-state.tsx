'use client';

import { ReactNode } from 'react';

import { cn } from '@/components/ui/cn';
import { NoDataIllustration } from '@/components/ui/no-data-illustration';

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
};

export function EmptyState({ icon, title, description, action, compact }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-4', compact ? 'py-8' : 'py-16')}>
      {icon ? (
        <div
          className={cn(
            'flex items-center justify-center rounded-2xl border border-[var(--panel-line)] bg-[var(--surface-subtle)]',
            compact ? 'h-14 w-14' : 'h-20 w-20'
          )}
        >
          {icon}
        </div>
      ) : (
        <NoDataIllustration className={compact ? 'h-16 w-auto' : 'h-24 w-auto'} />
      )}
      <h3
        className={cn(
          'font-semibold text-[var(--heading)]',
          compact ? 'mt-3 text-sm' : 'mt-5 text-base'
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            'max-w-xs text-center text-[var(--muted)]',
            compact ? 'mt-1 text-xs' : 'mt-1.5 text-sm'
          )}
        >
          {description}
        </p>
      )}
      {action && <div className={compact ? 'mt-3' : 'mt-5'}>{action}</div>}
    </div>
  );
}

export function EmptyStateIcon({
  type,
  size = 40,
}: {
  type: 'students' | 'payments' | 'staff' | 'data' | 'search' | 'calendar' | 'photo' | 'savings' | 'fees';
  size?: number;
}) {
  const icons: Record<string, ReactNode> = {
    students: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-[var(--muted)]">
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5.5 19.5C5.5 16.5 8 14.5 12 14.5C16 14.5 18.5 16.5 18.5 19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    payments: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-[var(--muted)]">
        <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 14H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    staff: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-[var(--muted)]">
        <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="17" cy="7" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 19C3 16.5 5.5 15 9 15C10.5 15 11.8 15.3 12.8 15.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M14 18C14 16.5 15.2 15.5 17 15.5C18.8 15.5 20 16.5 20 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    data: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-[var(--muted)]">
        <path d="M4 6H20M4 10H20M4 14H14M4 18H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M20 18L21.5 19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    search: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-[var(--muted)]">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 16L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    calendar: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-[var(--muted)]">
        <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 9H21" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 3V5M16 3V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="7" y="12" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.3" />
      </svg>
    ),
    photo: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-[var(--muted)]">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8.5" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M21 16L16.5 12L11 16.5L8.5 14.5L3 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    savings: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-[var(--muted)]">
        <path d="M19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5Z" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 9H6M18 9H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    fees: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-[var(--muted)]">
        <path d="M9 7H15M9 11H15M9 15H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  };
  return <>{icons[type] ?? icons.data}</>;
}
