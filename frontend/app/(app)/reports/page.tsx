'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldX } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { AppShell } from '@/components/app/shell';
import { apiFetch } from '@/lib/api';

// Lazy load tab content
import dynamic from 'next/dynamic';
const ReportsTab = dynamic(() => import('./tabs/reports-tab'), { ssr: false });
const TransactionsTab = dynamic(() => import('./tabs/transactions-tab'), { ssr: false });
const ExpensesTab = dynamic(() => import('./tabs/expenses-tab'), { ssr: false });

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'reports');

  // Sync tab with URL param when it changes
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const { data: me } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => apiFetch<{ role: string; permissions: string[] }>('/auth/me'),
    staleTime: Infinity,
  });

  const isAdmin = me?.role === 'admin';
  const permissions = me?.permissions ?? [];

  // All possible tabs
  const ALL_TABS = [
    { id: 'reports', label: 'Reports & Analytics', permission: 'reports' },
    { id: 'transactions', label: 'Transactions', permission: 'transactions' },
    { id: 'expenses', label: 'Expenses', permission: 'expenses' },
  ];

  // Tabs visible to this user
  const visibleTabs = ALL_TABS.filter((tab) => isAdmin || permissions.includes(tab.permission));

  // Check if the requested tab is accessible
  const hasAccessToTab = isAdmin || permissions.includes(activeTab) || visibleTabs.some((t) => t.id === activeTab);
  const effectiveTab = visibleTabs.find((t) => t.id === activeTab) ? activeTab : (visibleTabs[0]?.id ?? 'reports');

  // If user navigated to a tab they don't have access to
  const accessDenied = !hasAccessToTab && tabFromUrl;

  const tabNav = (
    <div className="flex items-end">
      {visibleTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-2 text-[13px] font-medium border border-b-0 transition-colors ${
            effectiveTab === tab.id
              ? 'bg-white text-[var(--heading)] border-[var(--panel-line)] relative z-10 -mb-px'
              : 'bg-[#f1f5f9] text-[var(--muted)] border-[var(--panel-line)] hover:text-[var(--heading)] hover:bg-[#f8fafc]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <AppShell title="Reports" subtitle="Analytics, fee payments, and expense tracking." action={!accessDenied ? tabNav : undefined}>
      {accessDenied ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--panel-line)] bg-[var(--chip-danger-bg)]">
            <ShieldX size={28} className="text-[var(--danger)]" />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-[var(--heading)]">Access Denied</h2>
          <p className="mt-2 max-w-sm text-center text-sm text-[var(--muted)]">
            You don't have permission to view this section. Contact your administrator to get access.
          </p>
        </div>
      ) : (
        <div className="border border-[var(--panel-line)] bg-white p-3 sm:p-4">
          {effectiveTab === 'reports' && <ReportsTab />}
          {effectiveTab === 'transactions' && <TransactionsTab />}
          {effectiveTab === 'expenses' && <ExpensesTab />}
        </div>
      )}
    </AppShell>
  );
}
