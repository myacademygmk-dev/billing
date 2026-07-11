'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Users, CalendarCheck } from 'lucide-react';

import { AppShell } from '@/components/app/shell';
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
    <div className="flex items-end">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = effectiveTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium border border-b-0 transition-colors ${
              isActive
                ? 'bg-white text-[var(--heading)] border-[var(--panel-line)] relative z-10 -mb-px'
                : 'bg-[#f1f5f9] text-[var(--muted)] border-[var(--panel-line)] hover:text-[var(--heading)] hover:bg-[#f8fafc]'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <AppShell
      title="Student Management"
      subtitle="Manage student records, track payments, and mark daily attendance."
      action={tabNav}
    >
      <div className="flex flex-col flex-1 min-h-0 border border-[var(--panel-line)] bg-white overflow-hidden">
        <div className="flex flex-col flex-1 min-h-0 p-3 sm:p-4">
          {effectiveTab === 'students' && <StudentsTab />}
          {effectiveTab === 'attendance' && <AttendanceTab />}
        </div>
      </div>
    </AppShell>
  );
}
