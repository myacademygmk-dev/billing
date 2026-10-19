import Link from 'next/link';
import { CreditCard, PiggyBank } from 'lucide-react';

export function LedgerNavigation({ active }: { active: 'payments' | 'savings' }) {
  return <nav aria-label="Finance" className="page-tabs mb-4 flex flex-wrap gap-1 border-b border-[var(--panel-line)]">
    {[{ key: 'payments', href: '/collect', label: 'Fee payments', icon: CreditCard }, { key: 'savings', href: '/savings', label: 'Student savings', icon: PiggyBank }].map(({ key, href, label, icon: Icon }) => (
      <Link key={key} href={href} aria-current={active === key ? 'page' : undefined} className={`inline-flex min-h-10 items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium ${active === key ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--heading)]'}`}><Icon size={16} />{label}</Link>
    ))}
  </nav>;
}
