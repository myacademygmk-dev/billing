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

  return (
    <AppShell
      title="Student Management"
      subtitle="Manage student records, track payments, and mark daily attendance."
    >
      {/* Tab Navigation */}
      <div className="mb-5 inline-flex gap-0.5 rounded-full border border-[var(--field-border)] bg-[var(--surface-subtle)] p-0.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-150 ${
                effectiveTab === tab.id
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'text-[var(--muted)] hover:text-[var(--heading)]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {effectiveTab === 'students' && <StudentsTab />}
      {effectiveTab === 'attendance' && <AttendanceTab />}
    </AppShell>
  );
}
