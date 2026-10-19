'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, BarChart2, Download, TableIcon, Banknote, UserCheck, Users, CalendarDays, ArrowUpRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricTile } from '@/components/ui/app-ux';
import { BarChart } from '@/components/ui/charts';
import { EmptyState, EmptyStateIcon } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Table, TBody, TD, TH, THead } from '@/components/ui/table';
import { apiFetch } from '@/lib/api';
import { debounce } from '@/lib/debounce';
import { cn } from '@/components/ui/cn';

type MonthlyStudent = {
  student_id: string;
  student_code: string;
  name: string;
  class_name: string | null;
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

export function monthlyStudentsExportHref({
  month,
  paymentState,
  search,
  classCode,
}: {
  month: string;
  paymentState: 'paid' | 'unpaid' | 'all';
  search: string;
  classCode: string;
}) {
  const params = new URLSearchParams({
    month: toMonthDate(month),
    payment_state: paymentState,
  });
  if (search.trim()) params.set('search', search.trim());
  if (classCode.trim()) params.set('class_code', classCode.trim());
  return `/api/backend/export/monthly-students.csv?${params.toString()}`;
}

function QueryError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{message}</p>
          <Button type="button" size="sm" variant="outline" className="mt-3" onClick={onRetry}>
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ReportsTab() {
  const currentYear = new Date().getFullYear();
  const today = new Date();
  const currentMonth = `${currentYear}-${String(today.getMonth() + 1).padStart(2, '0')}`;

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
    enabled: view === 'table',
    queryKey: ['monthlyStudentReport', month, paymentState, debouncedSearch, debouncedClassCode],
    queryFn: () => apiFetch<MonthlyStudent[]>(
      `/reports/monthly-students?month=${encodeURIComponent(toMonthDate(month))}&payment_state=${paymentState}&search=${encodeURIComponent(debouncedSearch)}&class_code=${encodeURIComponent(debouncedClassCode)}`
    )
  });

  // Chart data filtered by from/to range
  const annual = useQuery({
    enabled: view === 'chart' && !!chartFrom && !!chartTo && chartFrom <= chartTo,
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
  const exportHref = useMemo(() => {
    return monthlyStudentsExportHref({
      month,
      paymentState,
      search: debouncedSearch,
      classCode: debouncedClassCode,
    });
  }, [debouncedClassCode, debouncedSearch, month, paymentState]);

  // Prepare chart data
  const monthlyChartData = (annual.data?.monthly_breakdown ?? []).map((m) => ({
    label: m.month_name.slice(0, 3) + (m.year ? ` '${String(m.year).slice(2)}` : ''),
    value: Number(m.total),
  }));

  const modeChartData = (annual.data?.mode_breakdown ?? []).map((m) => ({
    label: m.mode.charAt(0).toUpperCase() + m.mode.slice(1),
    value: Number(m.total),
    color: m.mode === 'cash' ? '#059669' : m.mode === 'upi' ? '#0284c7' : '#d97706',
  }));
  const rangeTotal = monthlyChartData.reduce((sum, item) => sum + item.value, 0);
  const modeTotal = modeChartData.reduce((sum, item) => sum + item.value, 0);
  const rangeValid = !!chartFrom && !!chartTo && chartFrom <= chartTo;
  const money = (value: number) => `Rs. ${value.toLocaleString('en-IN')}`;

  // Chart range label
  const chartRangeLabel = `${monthLabel(chartFrom)} – ${monthLabel(chartTo)}`;

  return (
    <div className="reports-overview space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-[var(--heading)]">Financial overview</h2><p className="mt-1 text-xs text-[var(--muted)]">{view === 'chart' ? chartRangeLabel : monthLabel(month)}</p></div>
        <div className="inline-flex rounded-[6px] border border-[var(--panel-line)] bg-[var(--surface-subtle)] p-1">
          <button type="button" title="Chart view" aria-label="Show chart view" aria-pressed={view === 'chart'} onClick={() => setView('chart')} className={cn('inline-flex min-h-9 items-center gap-2 rounded-[4px] px-3 text-sm font-medium', view === 'chart' ? 'bg-white text-[var(--accent)] shadow-sm' : 'text-[var(--muted)]')}><BarChart2 size={16} />Analytics</button>
          <button type="button" title="Student table" aria-label="Show table view" aria-pressed={view === 'table'} onClick={() => setView('table')} className={cn('inline-flex min-h-9 items-center gap-2 rounded-[4px] px-3 text-sm font-medium', view === 'table' ? 'bg-white text-[var(--accent)] shadow-sm' : 'text-[var(--muted)]')}><TableIcon size={16} />Students</button>
        </div>
      </div>
      {/* Controls */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-y border-[var(--panel-line)] py-3">
        <div className="flex flex-wrap items-center gap-2">
          {view === 'chart' && (
            <>
              <label className="grid gap-1 text-xs text-[var(--muted)]">From<Input className="h-9 w-[155px]" type="month" value={chartFrom} onChange={(e) => { if (e.target.value) setChartFrom(e.target.value); }} /></label>
              <label className="grid gap-1 text-xs text-[var(--muted)]">To<Input className="h-9 w-[155px]" type="month" value={chartTo} onChange={(e) => { if (e.target.value) setChartTo(e.target.value); }} /></label>
            </>
          )}
          {view === 'table' && (
            <>
              <Input aria-label="Report month" className="h-9 w-[155px] rounded-lg" type="month" value={month} onChange={(e) => { if (e.target.value) setMonth(e.target.value); }} />
              <select aria-label="Payment status" className="theme-select h-9 rounded-lg px-3 text-sm" value={paymentState} onChange={(e) => setPaymentState(e.target.value as 'all' | 'paid' | 'unpaid')}>
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Not Paid</option>
              </select>
              <Input aria-label="Filter by class" className="h-9 w-[100px] rounded-lg" value={classCode} onChange={(e) => setClassCode(e.target.value)} placeholder="Class" />
              <Input aria-label="Search report students" className="h-9 w-[180px] rounded-lg" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or roll number" />
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {view === 'table' && <Button size="sm" variant="outline" onClick={() => window.location.assign(exportHref)}><Download className="h-3.5 w-3.5" />Export CSV</Button>}
        </div>
      </div>

      {/* KPI Cards */}
      {summary.isError ? (
        <QueryError message="Report summary could not be loaded." onRetry={() => summary.refetch()} />
      ) : (
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--heading)]">Monthly snapshot <span className="ml-2 font-normal text-[var(--muted)]">{monthLabel(month)}</span></h2>
          <Button size="sm" variant="ghost" onClick={() => { setPaymentState('unpaid'); setView('table'); }}>Review unpaid students<ArrowUpRight size={15} /></Button>
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <MetricTile label="Paid students" value={summary.isLoading ? '...' : paidCount} tone="success" icon={UserCheck} />
          <MetricTile label="Unpaid students" value={summary.isLoading ? '...' : unpaidCount} tone="warning" icon={Users} />
          <MetricTile label="Month collected" value={summary.isLoading ? '...' : money(Number(summary.data?.month_total ?? 0))} tone="accent" icon={Banknote} />
          <MetricTile label="Collected today" value={summary.isLoading ? '...' : money(Number(summary.data?.today_total ?? 0))} icon={CalendarDays} />
        </div>
        {!summary.isLoading && paidCount + unpaidCount > 0 && <div>
          <div className="mb-1 flex justify-between text-xs text-[var(--muted)]"><span>Students paid</span><span>{Math.round(paidCount / (paidCount + unpaidCount) * 100)}%</span></div>
          <progress aria-label="Students paid" className="h-2 w-full accent-emerald-600" max={paidCount + unpaidCount} value={paidCount} />
        </div>}
      </section>
      )}

      {/* Chart View */}
      {view === 'chart' && !rangeValid && <div role="alert" className="text-sm text-[var(--danger)]">The end month must be on or after the start month.</div>}
      {view === 'chart' && rangeValid && (
        <div className="grid gap-6 border-y border-[var(--panel-line)] py-5 xl:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
          <section className="min-w-0" aria-label="Revenue trend">
            <div className="mb-4"><h3 className="text-sm font-semibold">Revenue trend</h3><p className="mt-1 text-xs text-[var(--muted)]">{chartRangeLabel}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{annual.isError ? 'Unavailable' : annual.isLoading ? '...' : money(rangeTotal)}</p></div>
            <div className="min-h-[236px]">
              {annual.isLoading ? <div role="status" className="flex items-center gap-2 text-sm text-[var(--muted)]"><Spinner />Loading revenue</div> : annual.isError ? (
                <QueryError message="Revenue chart could not be loaded." onRetry={() => annual.refetch()} />
              ) : monthlyChartData.length > 0 ? (
                <BarChart data={monthlyChartData} height={200} />
              ) : (
                <div className="py-8 text-center text-sm text-[var(--muted)]">No data available</div>
              )}
            </div>
          </section>
          <section aria-label="Payment methods" className="min-w-0 border-t border-[var(--panel-line)] pt-4 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
            <h3 className="mb-1 text-sm font-semibold">Payment methods</h3><p className="mb-6 text-xs text-[var(--muted)]">{chartRangeLabel}</p>
            <div>
              {annual.isLoading ? <Spinner /> : annual.isError ? (
                <QueryError message="Payment mode chart could not be loaded." onRetry={() => annual.refetch()} />
              ) : modeChartData.length > 0 ? (
                <ul className="space-y-5">{modeChartData.map((item) => <li key={item.label}><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: item.color }} />{item.label}</span><span className="font-semibold tabular-nums">{money(item.value)}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-subtle)]"><div className="h-full rounded-full" style={{ width: `${modeTotal > 0 ? Math.max(0, Math.min(100, item.value / modeTotal * 100)) : 0}%`, background: item.color }} /></div><p className="mt-1 text-right text-xs text-[var(--muted)]">{modeTotal > 0 ? Math.round(item.value / modeTotal * 100) : 0}%</p></li>)}</ul>
              ) : (
                <div className="py-8 text-center text-sm text-[var(--muted)]">No data</div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <section className="min-w-0" aria-label="Student payment status">
          <div className="border-b border-[var(--panel-line)] pb-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Student payment status</h3>
              <Badge className="theme-chip-neutral">{monthLabel(month)}</Badge>
            </div>
          </div>
          <div>
            {students.isLoading ? (
              <div className="flex items-center gap-2 py-6"><Spinner /> Loading</div>
            ) : students.isError ? (
              <QueryError message="Student month status could not be loaded." onRetry={() => students.refetch()} />
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
                        <TD className="font-semibold"><Link className="hover:text-[var(--accent)] hover:underline" href={`/students/${s.student_id}`}>{s.name}</Link></TD>
                        <TD>{s.class_name ?? '-'}</TD>
                        <TD>₹{Number(s.monthly_fee).toLocaleString('en-IN')}</TD>
                        <TD>{s.month_label}</TD>
                        <TD><Badge className={s.is_paid ? 'theme-chip-success' : 'theme-chip-warn'}>{s.is_paid ? 'Paid' : 'Not Paid'}</Badge></TD>
                      </tr>
                    ))}
                  </TBody>
                </Table>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
