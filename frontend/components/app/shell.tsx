'use client';

import {
  Banknote,
  BarChart3,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  ReceiptText,
  Settings,
  UserCog,
  UsersRound,
  X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/components/ui/cn';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false, permission: 'dashboard' },
  { href: '/students', label: 'Students', icon: UsersRound, adminOnly: false, permission: 'students' },
  { href: '/collect', label: 'Collect', icon: Banknote, adminOnly: false, permission: 'collect' },
  { href: '/savings', label: 'Savings', icon: PiggyBank, adminOnly: false, permission: 'savings' },
  { href: '/expenses', label: 'Expenses', icon: HandCoins, adminOnly: false, permission: 'expenses' },
  { href: '/transactions', label: 'Transactions', icon: ReceiptText, adminOnly: false, permission: 'transactions' },
  { href: '/reports', label: 'Reports', icon: BarChart3, adminOnly: false, permission: 'reports' },
  { href: '/settings', label: 'Settings', icon: Settings, adminOnly: true, permission: 'settings' },
  { href: '/settings/users', label: 'Users', icon: UserCog, adminOnly: true, permission: 'settings' }
];

function SidebarContent({
  visibleNav,
  pathname,
  role,
  onNavClick
}: {
  visibleNav: typeof nav;
  pathname: string | null;
  role: string | null;
  onNavClick?: () => void;
}) {
  return (
    <>
      <div className="px-2 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="theme-sidebar-brand font-[var(--font-display)] text-xl font-semibold">MY Academy</div>
            <div className="theme-sidebar-subtitle text-sm">Educational Institutions</div>
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
              onClick={onNavClick}
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
    </>
  );
}

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: me } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => apiFetch<{ role: string; username: string; permissions: string[] }>('/auth/me'),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const role = me?.role ?? null;
  const permissions = me?.permissions ?? [];
  const visibleNav = nav.filter((item) => {
    // Admin-only items (settings) require admin role
    if (item.adminOnly && role !== 'admin') return false;
    // Admin always sees everything
    if (role === 'admin') return true;
    // Staff sees items based on their permissions
    return permissions.includes(item.permission);
  });

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setSidebarOpen(false);
    }
    if (sidebarOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [sidebarOpen]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [sidebarOpen]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="min-h-screen lg:grid lg:h-screen lg:grid-cols-[290px_minmax(0,1fr)] lg:overflow-hidden">
      {/* Mobile header bar */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-[var(--panel-line)] bg-[var(--sidebar-bg)] px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)] focus:outline-none focus:ring-2 focus:ring-[rgba(47,111,237,0.28)]"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex-1 truncate">
          <span className="theme-sidebar-brand font-[var(--font-display)] text-base font-semibold">{title}</span>
        </div>
        {role && (
          <span className="rounded-md bg-[rgba(255,255,255,0.12)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--sidebar-muted)]">
            {role}
          </span>
        )}
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          aria-modal="true"
          role="dialog"
          aria-label="Navigation menu"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[rgba(3,6,11,0.72)] animate-fade-in"
            onClick={closeSidebar}
            aria-hidden="true"
          />
          {/* Slide-in panel */}
          <aside className="theme-sidebar absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col border-r px-5 py-5 shadow-2xl animate-slide-in-left">
            <div className="mb-2 flex items-center justify-end">
              <button
                type="button"
                onClick={closeSidebar}
                className="inline-flex items-center justify-center rounded-lg p-2 text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)] focus:outline-none focus:ring-2 focus:ring-[rgba(47,111,237,0.28)]"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent
              visibleNav={visibleNav}
              pathname={pathname}
              role={role}
              onNavClick={closeSidebar}
            />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="theme-sidebar hidden flex-col border-r px-5 py-5 lg:flex lg:h-screen">
        <SidebarContent
          visibleNav={visibleNav}
          pathname={pathname}
          role={role}
        />
      </aside>

      <main className="px-4 py-5 sm:px-6 lg:h-screen lg:overflow-y-auto lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="theme-heading text-2xl font-semibold tracking-[-0.03em] sm:text-3xl lg:text-4xl">{title}</h1>
              {subtitle ? (
                <p className="mt-2 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm text-[var(--text-muted)] sm:mt-3 sm:text-base">
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
