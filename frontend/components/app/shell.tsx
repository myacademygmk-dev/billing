'use client';

import {
  Banknote,
  BarChart3,
  HandCoins,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  ReceiptText,
  Settings,
  UserCog,
  UsersRound
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/components/ui/cn';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { href: '/students', label: 'Students', icon: UsersRound, adminOnly: false },
  { href: '/collect', label: 'Collect', icon: Banknote, adminOnly: false },
  { href: '/savings', label: 'Savings', icon: PiggyBank, adminOnly: false },
  { href: '/expenses', label: 'Expenses', icon: HandCoins, adminOnly: false },
  { href: '/transactions', label: 'Transactions', icon: ReceiptText, adminOnly: false },
  { href: '/reports', label: 'Reports', icon: BarChart3, adminOnly: true },
  { href: '/settings', label: 'Settings', icon: Settings, adminOnly: true },
  { href: '/settings/users', label: 'Users', icon: UserCog, adminOnly: true }
];

export function AppShell({
  children,
  title,
  subtitle,
  action
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const pathname = usePathname();

  const { data: me } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => apiFetch<{ role: string; username: string }>('/auth/me'),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false,
  });

  const role = me?.role ?? null;
  const visibleNav = nav.filter((item) => !item.adminOnly || role === 'admin');

  return (
    <div className="min-h-screen lg:grid lg:h-screen lg:grid-cols-[290px_minmax(0,1fr)] lg:overflow-hidden">
      <aside className="theme-sidebar flex flex-col border-b px-5 py-5 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="px-2 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="theme-sidebar-brand font-[var(--font-display)] text-xl font-semibold">MYACADEMY</div>
              <div className="theme-sidebar-subtitle text-sm">Institution Billing Suite</div>
            </div>
            {role && (
              <span className="rounded-md bg-[rgba(255,255,255,0.12)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--sidebar-muted)]">
                {role}
              </span>
            )}
          </div>
        </div>

        <nav className="mt-6 grid gap-1">
          {visibleNav.map((item) => {
            const active = pathname === item.href || (item.href !== '/settings' && pathname?.startsWith(`${item.href}/`));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'theme-nav-item flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors duration-150',
                  active
                    ? 'theme-nav-item-active shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                    : 'border-transparent'
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-[var(--sidebar-border)] pt-4">
          <Button
            variant="outline"
            className="w-full justify-start border-[var(--sidebar-border)] bg-transparent text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)] [&_svg]:text-[var(--sidebar-muted)]"
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.assign('/login');
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      <main className="px-4 py-5 sm:px-6 lg:h-screen lg:overflow-y-auto lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="theme-heading text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{title}</h1>
              {subtitle ? (
                <p className="mt-3 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-base text-[var(--text-muted)]">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>

          <div>{children}</div>
        </div>
      </main>
    </div>
  );
}
