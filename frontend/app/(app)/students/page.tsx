'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Users, CalendarCheck } from 'lucide-react';

import { AppShell } from '@/components/app/shell';
import { PageTabs } from '@/components/ui/page-tabs';
import { apiFetch } from '@/lib/api';

const StudentsTab = dynamic(() => import('./tabs/students-tab'), { ssr: false });
const AttendanceTab = dynamic(() => import('./tabs/attendance-tab'), { ssr: false });

export default function StudentsPage() {
  const [activeTab, setActiveTab] = useState('students');

  const { data: me } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => apiFetch<{ role: string; permissions: string[] }>('/auth/me'),
    staleTime: Infinity,
  });

  const isAdmin = me?.role === 'admin';
  const permissions = me?.permissions ?? [];

  const TABS = [
    { id: 'students', label: 'Students', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  ].filter((tab) => isAdmin || tab.id === 'students' || permissions.includes(tab.id));

  // Compute effective tab — if active tab is not visible, fall back to first
  const effectiveTab = TABS.find((t) => t.id === activeTab) ? activeTab : (TABS[0]?.id ?? 'students');

  const tabNav = (
    <PageTabs label="Student sections" items={TABS} value={effectiveTab} onValueChange={setActiveTab} />
  );

  return (
    <AppShell
      title="Student Management"
      compactHeader
      action={tabNav}
    >
      <div className="flex flex-col flex-1 min-h-0 bg-white overflow-hidden">
        <div className="flex flex-col flex-1 min-h-0 p-3">
          {effectiveTab === 'students' && <StudentsTab />}
          {effectiveTab === 'attendance' && <AttendanceTab />}
        </div>
      </div>
    </AppShell>
  );
}
