'use client';

import { useState } from 'react';
import { CheckCircle2, Save } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
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
  present: { label: 'Present', short: 'P', activeClass: 'bg-green-500/20 text-green-300 border-green-500/40 shadow-[0_0_6px_rgba(34,197,94,0.15)]' },
  absent: { label: 'Absent', short: 'A', activeClass: 'bg-red-500/20 text-red-300 border-red-500/40 shadow-[0_0_6px_rgba(239,68,68,0.15)]' },
  late: { label: 'Late', short: 'L', activeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 shadow-[0_0_6px_rgba(234,179,8,0.15)]' },
  leave: { label: 'Leave', short: 'LV', activeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-[0_0_6px_rgba(59,130,246,0.15)]' },
};

export default function AttendanceTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [classFilter, setClassFilter] = useState('');
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({});

  const classesQuery = useQuery<string[]>({
    queryKey: ['studentClasses'],
    queryFn: () => apiFetch<string[]>('/students/classes'),
  });

  const studentAttendance = useQuery<{ items: AttendanceItem[]; total: number; marked: number }>({
    queryKey: ['studentAttendance', selectedDate, classFilter],
    queryFn: () => apiFetch(`/attendance/students?date=${selectedDate}&class_name=${classFilter}`),
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
      studentAttendance.data.items.forEach((item) => { newStatus[item.student_id] = 'present'; });
      setLocalStatus(newStatus);
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
  const marked = studentAttendance.data?.marked ?? 0;

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
        <div className="flex items-center gap-2">
          <Input
            type="date"
            className="h-9 w-[155px] rounded-lg text-sm"
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setLocalStatus({}); }}
          />
          <select
            className="h-9 w-[130px] rounded-lg border border-[var(--panel-line)] bg-[var(--surface)] px-2 text-sm text-[var(--heading)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
            value={classFilter}
            onChange={(e) => { setClassFilter(e.target.value); setLocalStatus({}); }}
          >
            <option value="">Select Class</option>
            {classesQuery.data?.map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={markAllPresent}>
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />All Present
          </Button>
          <Button size="sm" onClick={saveAttendance} disabled={markStudents.isPending || !hasChanges}>
            {markStudents.isPending ? <Spinner className="mr-1.5 h-3.5 w-3.5" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            Save{hasChanges ? ` (${Object.keys(localStatus).length})` : ''}
          </Button>
        </div>
      </div>

      {/* Info strip */}
      <div className="mt-3 flex items-center gap-3 text-xs text-[var(--muted)]">
        <span className="font-medium text-[var(--heading)] text-sm">{dateLabel}</span>
        <span className="text-[var(--panel-line)]">|</span>
        <span>Total: <strong className="text-[var(--heading)]">{total}</strong></span>
        <span>Present: <strong className="text-green-400">{marked}</strong></span>
        <span>Unmarked: <strong className="text-yellow-400">{total - marked}</strong></span>
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
                  className={`flex items-center gap-4 px-4 py-2.5 transition-colors ${
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
                        className={`h-7 w-9 rounded-md border text-[11px] font-bold transition-all ${
                          current === statusKey
                            ? config.activeClass
                            : 'border-[var(--panel-line)] text-[var(--muted)] opacity-30 hover:opacity-60'
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
