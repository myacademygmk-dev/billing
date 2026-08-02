'use client';

import {
  Banknote,
  BarChart3,
  ChevronLeft,
  CreditCard,
  Globe,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  Settings,
  UserCog,
  UsersRound,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/components/ui/cn';

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly: boolean;
  permission: string;
  group: 'main' | 'finance' | 'academic' | 'management';
};

const nav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false, permission: 'dashboard', group: 'main' },
  { href: '/students', label: 'Students', icon: UsersRound, adminOnly: false, permission: 'students', group: 'academic' },
  { href: '/academic', label: 'Academics', icon: GraduationCap, adminOnly: false, permission: 'academic', group: 'academic' },
  { href: '/collect', label: 'Payments', icon: Banknote, adminOnly: false, permission: 'collect', group: 'finance' },
  { href: '/savings', label: 'Savings', icon: PiggyBank, adminOnly: false, permission: 'savings', group: 'finance' },
  { href: '/fees', label: 'Fee Structure', icon: CreditCard, adminOnly: false, permission: 'fees', group: 'finance' },
  { href: '/reports', label: 'Reports', icon: BarChart3, adminOnly: false, permission: 'reports', group: 'finance' },
  { href: '/staff', label: 'Staff', icon: UserCog, adminOnly: false, permission: 'staff', group: 'management' },
  { href: '/enquiries', label: 'Enquiries', icon: Inbox, adminOnly: false, permission: 'students', group: 'management' },
  { href: '/cms', label: 'Website', icon: Globe, adminOnly: false, permission: 'cms', group: 'management' },
  { href: '/settings', label: 'Settings', icon: Settings, adminOnly: true, permission: 'settings', group: 'management' },
];

const groupLabels: Record<string, string> = {
  main: '',
  academic: 'Academic',
  finance: 'Finance',
  management: 'Manage',
};

function SidebarContent({
  visibleNav,
  pathname,
  role,
  onNavClick,
}: {
  visibleNav: NavItem[];
  pathname: string | null;
  role: string | null;
  onNavClick?: () => void;
}) {
  // Group nav items
  const groups = ['main', 'academic', 'finance', 'management'] as const;

  return (
    <>
      <div className="flex-shrink-0 px-2 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="theme-sidebar-brand font-[var(--font-display)] text-base font-semibold">MY Academy</div>
            <div className="theme-sidebar-subtitle text-xs">Educational Institutions</div>
          </div>
          {role && (
            <span className="rounded-md bg-[rgba(255,255,255,0.12)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--sidebar-muted)]">
              {role}
            </span>
          )}
        </div>
      </div>

      <nav className="mt-3 flex-1 space-y-4 overflow-y-auto min-h-0" aria-label="Main navigation">
        {groups.map((group) => {
          const items = visibleNav.filter((item) => item.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group}>
              {groupLabels[group] && (
                <div className="section-label mb-2 px-4">{groupLabels[group]}</div>
              )}
              <div className="grid gap-0.5">
                {items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== '/settings' && pathname?.startsWith(`${item.href}/`));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      onClick={onNavClick}
                      className={cn(
                        'theme-nav-item flex items-center gap-2.5 rounded-lg border px-3.5 py-2 text-[13px] font-medium',
                        active
                          ? 'theme-nav-item-active shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                          : 'border-transparent'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="flex-shrink-0 mt-auto space-y-2 border-t border-[var(--sidebar-border)] pt-4">
        {/* Logout */}
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2 text-[13px] font-medium text-[var(--sidebar-muted)] transition-colors hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]"
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.assign('/login');
          }}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
  action,
  headerAction,
  backHref,
  breadcrumbs,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  headerAction?: ReactNode;
  backHref?: string;
  breadcrumbs?: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: me } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => apiFetch<{ role: string; username: string; permissions: string[] }>('/auth/me'),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    retry: false,
  });

  const role = me?.role ?? null;
  const permissions = me?.permissions ?? [];
  const visibleNav = nav.filter((item) => {
    if (item.adminOnly && role !== 'admin') return false;
    if (role === 'admin') return true;
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
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [sidebarOpen]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="min-h-screen lg:grid lg:h-screen lg:grid-cols-[250px_minmax(0,1fr)] lg:overflow-hidden">
      {/* Skip to content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      {/* Mobile header bar */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-[var(--panel-line)] bg-[var(--sidebar-bg)] px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
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
          <div
            className="absolute inset-0 bg-[rgba(3,6,11,0.72)] animate-fade-in"
            onClick={closeSidebar}
            aria-hidden="true"
          />
          <aside className="theme-sidebar absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col border-r px-5 py-5 shadow-2xl animate-slide-in-left">
            <div className="mb-2 flex items-center justify-end">
              <button
                type="button"
                onClick={closeSidebar}
                className="inline-flex items-center justify-center rounded-lg p-2 text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent visibleNav={visibleNav} pathname={pathname} role={role} onNavClick={closeSidebar} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="theme-sidebar hidden flex-col border-r px-4 py-4 lg:flex lg:h-screen">
        <SidebarContent visibleNav={visibleNav} pathname={pathname} role={role} />
      </aside>

      {/* Main content area */}
      <main id="main-content" className="flex flex-col px-4 py-3 sm:px-5 lg:h-screen lg:overflow-hidden lg:px-6 lg:py-4">
        <div className="mx-auto max-w-7xl w-full flex flex-col flex-1 min-h-0">
          {/* Page header */}
          <div className={action ? 'mb-0' : 'mb-5'}>
            {breadcrumbs && <div className="mb-1">{breadcrumbs}</div>}
            <div className="flex items-center gap-3">
              {backHref && (
                <button
                  type="button"
                  onClick={() => router.push(backHref)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[var(--panel-line)] bg-[var(--surface-subtle)] text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
                  aria-label="Go back"
                >
                  <ChevronLeft size={14} />
                </button>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="theme-heading text-2xl font-semibold tracking-[-0.02em]">{title}</h1>
                {subtitle && <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">{subtitle}</p>}
              </div>
              {headerAction && <div className="shrink-0">{headerAction}</div>}
            </div>
            {action && (
              <div className="mt-3">
                {action}
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col min-h-0">{children}</div>
        </div>
      </main>
    </div>
  );
}
