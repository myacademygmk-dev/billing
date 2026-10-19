import type { LucideIcon } from 'lucide-react';

export function PageTabs<T extends string>({ label, items, value, onValueChange }: {
  label: string;
  items: { id: T; label: string; icon?: LucideIcon }[];
  value: T;
  onValueChange: (value: T) => void;
}) {
  return <nav aria-label={label} className="page-tabs flex flex-wrap gap-x-1 border-b border-[var(--panel-line)]">
    {items.map(({ id, label: name, icon: Icon }) => <button key={id} type="button" aria-pressed={value === id} onClick={() => onValueChange(id)} className={`inline-flex min-h-10 items-center justify-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${value === id ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--heading)]'}`}>
      {Icon && <Icon size={16} aria-hidden="true" />}{name}
    </button>)}
  </nav>;
}
