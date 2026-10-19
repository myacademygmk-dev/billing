'use client';

import { useState } from 'react';
import { CheckCircle2, Save } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { MetricTile } from '@/components/ui/app-ux';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toaster';
import { apiFetch } from '@/lib/api';

type AttendanceItem = {
  student_id: string;
  student_code: string;
  student_name: string;
  class_name?: string | null;
  date: string;
  status: string;
};

const STATUS_CONFIG: Record<string, { label: string; short: string; activeClass: string }> = {
  present: { label: 'Present', short: 'P', activeClass: 'bg-emerald-50 text-emerald-800 border-emerald-500' },
  absent: { label: 'Absent', short: 'A', activeClass: 'bg-rose-50 text-rose-800 border-rose-500' },
  late: { label: 'Late', short: 'L', activeClass: 'bg-amber-50 text-amber-800 border-amber-500' },
  leave: { label: 'Leave', short: 'LV', activeClass: 'bg-sky-50 text-sky-800 border-sky-500' },
};

export default function AttendanceTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [classFilter, setClassFilter] = useState('');
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({});

  const classesQuery = useQuery<string[]>({
    queryKey: ['studentClasses'],
    queryFn: () => apiFetch<string[]>('/students/classes'),
  });

  const studentAttendance = useQuery<{ items: AttendanceItem[]; total: number; marked: number }>({
    queryKey: ['studentAttendance', selectedDate, classFilter],
    queryFn: () => apiFetch(`/attendance/students?date=${selectedDate}&class_name=${encodeURIComponent(classFilter)}`),
    enabled: !!classFilter,
  });

  const markStudents = useMutation({
    mutationFn: (entries: { student_id: string; status: string }[]) =>
      apiFetch('/attendance/students', { method: 'POST', body: JSON.stringify({ date: selectedDate, entries }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['studentAttendance'] });
      setLocalStatus({});
      toast({ title: 'Attendance saved successfully' });
    },
    onError: (e) => toast({ title: 'Failed to save', description: String(e.message || e) }),
  });

  function getStatus(id: string, serverStatus: string) {
    return localStatus[id] ?? (serverStatus === 'not_marked' ? '' : serverStatus);
  }

  function setStatus(id: string, status: string) {
    setLocalStatus((prev) => ({ ...prev, [id]: status }));
  }

  function markAllPresent() {
    if (studentAttendance.data) {
      const newStatus: Record<string, string> = {};
      studentAttendance.data.items.forEach((item) => { if (!getStatus(item.student_id, item.status)) newStatus[item.student_id] = 'present'; });
      setLocalStatus((previous) => ({ ...previous, ...newStatus }));
    }
  }

  function saveAttendance() {
    const entries = Object.entries(localStatus)
      .filter(([, status]) => status)
      .map(([student_id, status]) => ({ student_id, status }));
    if (entries.length === 0) { toast({ title: 'No changes to save' }); return; }
    markStudents.mutate(entries);
  }

  const hasChanges = Object.keys(localStatus).length > 0;
  const total = studentAttendance.data?.total ?? 0;
  const counts = (studentAttendance.data?.items ?? []).reduce<Record<string, number>>((result, item) => {
    const status = getStatus(item.student_id, item.status) || 'unmarked';
    result[status] = (result[status] ?? 0) + 1; return result;
  }, {});

  const dateLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            aria-label="Attendance date"
            disabled={markStudents.isPending}
            className="h-9 w-[155px] rounded-lg text-sm"
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setLocalStatus({}); }}
          />
          <select
            className="h-9 w-[130px] rounded-lg border border-[var(--panel-line)] bg-[var(--surface)] px-2 text-sm text-[var(--heading)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
            value={classFilter}
            aria-label="Attendance class"
            disabled={markStudents.isPending}
            onChange={(e) => { setClassFilter(e.target.value); setLocalStatus({}); }}
          >
            <option value="">Select Class</option>
            {classesQuery.data?.map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={!studentAttendance.data?.items.length || markStudents.isPending} onClick={markAllPresent}>
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Remaining present
          </Button>
          <Button size="sm" onClick={saveAttendance} disabled={markStudents.isPending || !hasChanges}>
            {markStudents.isPending ? <Spinner className="mr-1.5 h-3.5 w-3.5" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            Save{hasChanges ? ` (${Object.keys(localStatus).length})` : ''}
          </Button>
        </div>
      </div>

      {/* Info strip */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
        <span className="font-medium text-[var(--heading)] text-sm">{dateLabel}</span>
        <span className="text-[var(--panel-line)]">|</span>
        <span>Total: <strong className="text-[var(--heading)]">{total}</strong></span>
        <span>{hasChanges ? `${Object.keys(localStatus).length} unsaved changes` : 'No unsaved changes'}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile label="Present" value={counts.present ?? 0} tone="success" />
        <MetricTile label="Absent" value={counts.absent ?? 0} tone="danger" />
        <MetricTile label="Late / leave" value={`${counts.late ?? 0} / ${counts.leave ?? 0}`} tone="accent" />
        <MetricTile label="Unmarked" value={counts.unmarked ?? 0} tone="warning" />
      </div>

      {/* Attendance List */}
      <div className="mt-4">
        {!classFilter ? (
          <div className="rounded-xl border border-[var(--panel-line)] px-6 py-12 text-center text-sm text-[var(--muted)]">
            Select a class to view attendance.
          </div>
        ) : studentAttendance.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--muted)]">
            <Spinner /> Loading students...
          </div>
        ) : studentAttendance.isError ? (
          <div role="alert" className="py-6 text-sm text-[var(--danger)]">Attendance could not be loaded. <Button variant="outline" size="sm" onClick={() => studentAttendance.refetch()}>Retry</Button></div>
        ) : !studentAttendance.data?.items.length ? (
          <div className="rounded-xl border border-[var(--panel-line)] px-6 py-12 text-center text-sm text-[var(--muted)]">
            No students found for the selected filters.
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--panel-line)] overflow-hidden divide-y divide-[rgba(148,163,184,0.08)]">
            {studentAttendance.data.items.map((item) => {
              const current = getStatus(item.student_id, item.status);
              const isModified = item.student_id in localStatus;
              return (
                <div
                  key={item.student_id}
                  className={`flex flex-wrap items-center gap-4 px-4 py-3 transition-colors ${
                    isModified ? 'bg-[var(--accent)]/[0.04]' : 'hover:bg-[var(--surface-subtle)]'
                  }`}
                >
                  {/* Student info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium text-[var(--heading)] truncate">{item.student_name}</span>
                      <span className="shrink-0 text-[11px] text-[var(--muted)]">{item.student_code}</span>
                    </div>
                    <div className="text-[11px] text-[var(--muted)] mt-0.5">
                      {item.class_name ?? "—"}
                    </div>
                  </div>

                  {/* Status buttons */}
                  <div className="flex gap-1.5 shrink-0">
                    {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => (
                      <button
                        key={statusKey}
                        onClick={() => setStatus(item.student_id, statusKey)}
                        title={config.label}
                        aria-label={`${item.student_name}: ${config.label}`}
                        aria-pressed={current === statusKey}
                        disabled={markStudents.isPending}
                        className={`h-10 w-12 rounded-md border text-xs font-bold transition-colors ${
                          current === statusKey
                            ? config.activeClass
                            : 'border-[var(--panel-line)] text-[var(--muted)] hover:bg-[var(--surface-subtle)]'
                        }`}
                      >
                        {config.short}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
