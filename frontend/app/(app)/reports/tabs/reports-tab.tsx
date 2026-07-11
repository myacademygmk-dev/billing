'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart2, Download, Search, TableIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, DonutChart } from '@/components/ui/charts';
import { EmptyState, EmptyStateIcon } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Table, TBody, TD, TH, THead } from '@/components/ui/table';
import { apiFetch } from '@/lib/api';
import { debounce } from '@/lib/debounce';

type MonthlyStudent = {
  student_id: string;
  student_code: string;
  name: string;
  class_name: string | null;
  section: string | null;
  payment_period: string;
  monthly_fee: string;
  month: string;
  month_label: string;
  is_paid: boolean;
  receipt_no?: string | null;
};

type Summary = {
  paid_students: number;
  unpaid_students: number;
  total_collected: string;
  month_total: string;
  today_total: string;
  active_students: number;
};

function toMonthDate(value: string) { return `${value}-01`; }
function monthLabel(value: string) {
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

export default function ReportsTab() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Table view filters
  const [month, setMonth] = useState(() => currentMonth);
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [paymentState, setPaymentState] = useState<'paid' | 'unpaid' | 'all'>('all');
  const [search, setSearch] = useState('');
  const [classCode, setClassCode] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debouncedClassCode, setDebouncedClassCode] = useState('');

  // Chart view filters (from/to month range)
  const [chartFrom, setChartFrom] = useState(() => `${currentYear}-01`);
  const [chartTo, setChartTo] = useState(() => currentMonth);

  const setDebounced = useMemo(() => debounce((v: string) => setDebouncedSearch(v), 250), []);
  const setDebouncedClass = useMemo(() => debounce((v: string) => setDebouncedClassCode(v), 250), []);
  useEffect(() => { setDebounced(search); }, [search, setDebounced]);
  useEffect(() => { setDebouncedClass(classCode); }, [classCode, setDebouncedClass]);

  const summary = useQuery({
    queryKey: ['reportSummary', month],
    queryFn: () => apiFetch<Summary>(`/reports/summary?month=${encodeURIComponent(toMonthDate(month))}`)
  });

  const students = useQuery({
    queryKey: ['monthlyStudentReport', month, paymentState, debouncedSearch, debouncedClassCode],
    queryFn: () => apiFetch<MonthlyStudent[]>(
      `/reports/monthly-students?month=${encodeURIComponent(toMonthDate(month))}&payment_state=${paymentState}&search=${encodeURIComponent(debouncedSearch)}&class_code=${encodeURIComponent(debouncedClassCode)}`
    )
  });

  // Chart data filtered by from/to range
  const annual = useQuery({
    queryKey: ['annualReport', currentYear, chartFrom, chartTo],
    queryFn: () => {
      const params = new URLSearchParams({ year: String(currentYear) });
      if (chartFrom) params.set('from', toMonthDate(chartFrom));
      if (chartTo) params.set('to', toMonthDate(chartTo));
      return apiFetch<{ monthly_breakdown: { month: number; year?: number; month_name: string; total: string; payment_count: number }[]; mode_breakdown: { mode: string; total: string; payment_count: number }[] }>(`/reports/annual?${params.toString()}`);
    }
  });

  const paidCount = summary.data?.paid_students ?? 0;
  const unpaidCount = summary.data?.unpaid_students ?? 0;
  const exportHref = `/api/backend/export/monthly-students.csv?month=${encodeURIComponent(toMonthDate(month))}&payment_state=${encodeURIComponent(paymentState)}`;

  // Prepare chart data
  const monthlyChartData = (annual.data?.monthly_breakdown ?? []).map((m) => ({
    label: m.month_name.slice(0, 3) + (m.year ? ` '${String(m.year).slice(2)}` : ''),
    value: Number(m.total),
  }));

  const modeChartData = (annual.data?.mode_breakdown ?? []).map((m) => ({
    label: m.mode.charAt(0).toUpperCase() + m.mode.slice(1),
    value: Number(m.total),
    color: m.mode === 'cash' ? '#22c55e' : m.mode === 'upi' ? '#3b82f6' : '#a855f7',
  }));

  // Chart range label
  const chartRangeLabel = `${monthLabel(chartFrom)} – ${monthLabel(chartTo)}`;

  return (
    <div className="page-grid">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {view === 'chart' && (
            <>
              <label className="text-xs text-[var(--muted)] font-medium">From</label>
              <Input className="h-9 w-[150px] rounded-lg" type="month" value={chartFrom} onChange={(e) => setChartFrom(e.target.value)} />
              <label className="text-xs text-[var(--muted)] font-medium">To</label>
              <Input className="h-9 w-[150px] rounded-lg" type="month" value={chartTo} onChange={(e) => setChartTo(e.target.value)} />
            </>
          )}
          {view === 'table' && (
            <>
              <Input className="h-9 w-[150px] rounded-lg" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
              <select className="theme-select h-9 rounded-lg px-3 text-sm" value={paymentState} onChange={(e) => setPaymentState(e.target.value as any)}>
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Not Paid</option>
              </select>
              <Input className="h-9 w-[80px] rounded-lg" value={classCode} onChange={(e) => setClassCode(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="Class" />
              <Input className="h-9 w-[150px] rounded-lg" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-[var(--field-border)] overflow-hidden">
            <button onClick={() => setView('chart')} className={`px-3 py-1.5 ${view === 'chart' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)]'}`}>
              <BarChart2 className="h-4 w-4" />
            </button>
            <button onClick={() => setView('table')} className={`px-3 py-1.5 ${view === 'table' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)]'}`}>
              <TableIcon className="h-4 w-4" />
            </button>
          </div>
          <Button size="sm" variant="outline" onClick={() => window.location.assign(exportHref)}><Download className="mr-1 h-3.5 w-3.5" />CSV</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[var(--panel-line)] bg-[var(--surface-subtle)] p-4">
          <div className="text-[10px] font-semibold uppercase text-[var(--muted)]">Paid</div>
          <div className="mt-1 text-2xl font-bold text-green-400">{paidCount}</div>
        </div>
        <div className="rounded-xl border border-[var(--panel-line)] bg-[var(--surface-subtle)] p-4">
          <div className="text-[10px] font-semibold uppercase text-[var(--muted)]">Unpaid</div>
          <div className="mt-1 text-2xl font-bold text-yellow-400">{unpaidCount}</div>
        </div>
        <div className="rounded-xl border border-[var(--panel-line)] bg-[var(--surface-subtle)] p-4">
          <div className="text-[10px] font-semibold uppercase text-[var(--muted)]">This Month</div>
          <div className="mt-1 text-2xl font-bold text-[var(--heading)]">₹{Number(summary.data?.month_total ?? 0).toLocaleString()}</div>
        </div>
        <div className="rounded-xl border border-[var(--panel-line)] bg-[var(--surface-subtle)] p-4">
          <div className="text-[10px] font-semibold uppercase text-[var(--muted)]">Today</div>
          <div className="mt-1 text-2xl font-bold text-[var(--heading)]">₹{Number(summary.data?.today_total ?? 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Chart View */}
      {view === 'chart' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card square className="lg:col-span-2 overflow-visible">
            <CardHeader><CardTitle>Revenue ({chartRangeLabel})</CardTitle></CardHeader>
            <CardContent className="overflow-visible">
              {annual.isLoading ? <Spinner /> : monthlyChartData.length > 0 ? (
                <BarChart data={monthlyChartData} height={200} />
              ) : (
                <div className="py-8 text-center text-sm text-[var(--muted)]">No data available</div>
              )}
            </CardContent>
          </Card>
          <Card square>
            <CardHeader><CardTitle>By Payment Mode</CardTitle></CardHeader>
            <CardContent>
              {annual.isLoading ? <Spinner /> : modeChartData.length > 0 ? (
                <DonutChart data={modeChartData} size={130} />
              ) : (
                <div className="py-8 text-center text-sm text-[var(--muted)]">No data</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <Card square>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Student Month Status</CardTitle>
              <Badge className="theme-chip-neutral">{monthLabel(month)}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {students.isLoading ? (
              <div className="flex items-center gap-2 py-6"><Spinner /> Loading</div>
            ) : !students.data?.length ? (
              <EmptyState icon={<EmptyStateIcon type="data" />} title="No students found" description="No data for the selected filters" />
            ) : (
              <div className="overflow-auto max-h-[55vh]">
                <Table>
                  <THead><tr><TH>ID</TH><TH>Name</TH><TH>Class</TH><TH>Fee</TH><TH>Month</TH><TH>Status</TH></tr></THead>
                  <TBody>
                    {students.data.map((s) => (
                      <tr key={s.student_id}>
                        <TD>{s.student_code}</TD>
                        <TD className="font-semibold">{s.name}</TD>
                        <TD>{s.class_name ?? '-'}</TD>
                        <TD>{s.monthly_fee}</TD>
                        <TD>{s.month_label}</TD>
                        <TD><Badge className={s.is_paid ? 'theme-chip-success' : 'theme-chip-warn'}>{s.is_paid ? 'Paid' : 'Not Paid'}</Badge></TD>
                      </tr>
                    ))}
                  </TBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
