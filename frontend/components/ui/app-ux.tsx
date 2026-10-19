import type { ReactNode } from 'react';
import { CheckCircle2, CircleDot, type LucideIcon } from 'lucide-react';

import { cn } from '@/components/ui/cn';

export function WorkflowGuide({
  title,
  description,
  steps,
  className,
}: {
  title: string;
  description?: string;
  steps: string[];
  className?: string;
}) {
  return (
    <div className={cn('border-y border-[var(--panel-line)] bg-white py-3', className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="theme-heading text-sm font-semibold">{title}</h2>
          {description && <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {steps.map((step, index) => (
            <div key={step} className="inline-flex items-center gap-2 py-1 text-xs font-medium text-[var(--text)]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[10px] font-bold text-[var(--accent)]">
                {index + 1}
              </span>
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MetricTile({
  label,
  value,
  tone = 'neutral',
  icon: Icon,
  detail,
}: {
  label: string;
  value: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent';
  icon?: LucideIcon;
  detail?: ReactNode;
}) {
  const tones = {
    neutral: 'text-[var(--heading)] bg-[var(--surface-subtle)]',
    success: 'text-[var(--success)] bg-[var(--chip-success-bg)]',
    warning: 'text-[var(--warn)] bg-[var(--chip-warn-bg)]',
    danger: 'text-[var(--danger)] bg-[var(--chip-danger-bg)]',
    accent: 'text-[var(--accent)] bg-[var(--accent-soft)]',
  };

  return (
    <div data-tone={tone} className="metric-card min-w-0 rounded-[8px] border border-[var(--panel-line)] bg-white p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
          <div className={cn('mt-2 break-words text-xl font-semibold tabular-nums', tones[tone].split(' ')[0])}>{value}</div>
          {detail && <p className="mt-1 text-xs text-[var(--muted)]">{detail}</p>}
        </div>
        {Icon && (
          <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px]', tones[tone])}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}

export function ProfileField({
  label,
  value,
  wide,
}: {
  label: string;
  value?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={cn('min-w-0 border-b border-[var(--panel-line)] py-3', wide && 'sm:col-span-2 lg:col-span-3')}>
      <p className="text-xs font-normal text-[var(--muted)]">{label}</p>
      <div className="mt-1 break-words text-sm font-medium text-[var(--heading)]">{value ?? '-'}</div>
    </div>
  );
}

export function StatusStep({
  done,
  label,
  detail,
}: {
  done: boolean;
  label: string;
  detail?: string;
}) {
  const Icon = done ? CheckCircle2 : CircleDot;
  return (
    <div className="flex gap-3 rounded-lg border border-[var(--panel-line)] bg-white p-3">
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', done ? 'text-[var(--success)]' : 'text-[var(--muted)]')} />
      <div>
        <p className="text-sm font-semibold text-[var(--heading)]">{label}</p>
        {detail && <p className="mt-0.5 text-xs text-[var(--muted)]">{detail}</p>}
      </div>
    </div>
  );
}
