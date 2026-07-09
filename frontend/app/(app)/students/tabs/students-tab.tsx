'use client';

import Link from 'next/link';
import { Download, Eye, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Table, TBody, TD, TH, THead } from '@/components/ui/table';
import { useToast } from '@/components/ui/toaster';
import { apiFetch } from '@/lib/api';
import { debounce } from '@/lib/debounce';

type StudentListItem = {
  id: string;
  student_code: string;
  name: string;
  class_name: string | null;
  section: string | null;
  status: 'active' | 'inactive';
  expected_fee: string;
  paid_total: string;
  pending: string;
  last_paid_label: string | null;
  next_due_label: string | null;
  next_due_state: 'pending' | 'upcoming' | null;
};

type ListResp = { items: StudentListItem[]; total: number };

const createSchema = z.object({
  student_code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  class_name: z.string().max(100).optional(),
  section: z.string().max(50).optional()
});

type CreateValues = z.infer<typeof createSchema>;

export default function StudentsTab() {
  const [search, setSearch] = useState('');
  const [classCode, setClassCode] = useState('');
  const [debounced, setDebounced] = useState('');
  const [debouncedClassCode, setDebouncedClassCode] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('active');
  const [createOpen, setCreateOpen] = useState(false);

  const { toast } = useToast();
  const qc = useQueryClient();
  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { student_code: '', name: '', class_name: '', section: '' }
  });

  const setDebouncedFn = useMemo(() => debounce((v: string) => setDebounced(v), 250), []);
  const setDebouncedClassFn = useMemo(() => debounce((v: string) => setDebouncedClassCode(v), 250), []);
  useEffect(() => setDebouncedFn(search), [search, setDebouncedFn]);
  useEffect(() => setDebouncedClassFn(classCode), [classCode, setDebouncedClassFn]);

  const query = useQuery({
    queryKey: ['students', debounced, debouncedClassCode, page, status],
    queryFn: () =>
      apiFetch<ListResp>(
        `/students/balances?search=${encodeURIComponent(debounced)}&class_code=${encodeURIComponent(
          debouncedClassCode
        )}&status=${status === 'all' ? '' : status}&page=${page}&page_size=25`
      )
  });

  const createStudent = useMutation({
    mutationFn: (values: CreateValues) => apiFetch<StudentListItem>('/students', { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: () => {
      toast({ title: 'Student created' });
      setCreateOpen(false);
      form.reset();
      qc.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (e) => toast({ title: 'Create failed', description: String(e) })
  });

  const totalPages = query.data ? Math.max(1, Math.ceil(query.data.total / 25)) : 1;

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="h-9 rounded-lg pl-9 text-sm"
            />
          </div>
          <Input
            value={classCode}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, '').slice(0, 2);
              setClassCode(next);
              setPage(1);
            }}
            placeholder="Class"
            className="h-9 w-20 rounded-lg text-sm"
          />
          <select
            className="theme-select h-9 rounded-lg px-3 text-sm"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as 'all' | 'active' | 'inactive');
              setPage(1);
            }}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => window.location.assign('/api/backend/export/students.csv')}>
            <Download className="mr-1.5 h-3.5 w-3.5" />CSV
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />Add Student
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto border-t border-[var(--panel-line)]">
        <table className="w-full text-sm text-[var(--text)]">
              <thead className="sticky top-0 z-10 bg-[var(--table-head-bg)] backdrop-blur">
                <tr>
                  <th className="whitespace-nowrap border-b border-[rgba(148,163,184,0.12)] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Student</th>
                  <th className="whitespace-nowrap border-b border-[rgba(148,163,184,0.12)] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Fee</th>
                  <th className="whitespace-nowrap border-b border-[rgba(148,163,184,0.12)] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Last Paid</th>
                  <th className="whitespace-nowrap border-b border-[rgba(148,163,184,0.12)] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Next Due</th>
                  <th className="whitespace-nowrap border-b border-[rgba(148,163,184,0.12)] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Pending</th>
                  <th className="whitespace-nowrap border-b border-[rgba(148,163,184,0.12)] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] w-[60px]"></th>
                </tr>
              </thead>
              <tbody>
                {query.isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <div className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
                        <Spinner /> Loading students...
                      </div>
                    </td>
                  </tr>
                ) : query.isError ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-rose-400">
                      Failed to load students
                    </td>
                  </tr>
                ) : query.data?.items.length ? (
                  query.data.items.map((s) => (
                    <tr key={s.id} className="group transition-colors hover:bg-[var(--surface-subtle)]">
                      <td className="border-b border-[rgba(148,163,184,0.06)] px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[var(--heading)] truncate">{s.name}</span>
                              <Badge className={`shrink-0 text-[10px] ${s.status === 'active' ? 'theme-chip-success' : 'theme-chip-neutral'}`}>
                                {s.status}
                              </Badge>
                            </div>
                            <div className="mt-0.5 text-xs text-[var(--muted)]">
                              {s.student_code} • {s.class_name ?? '—'}{s.section ? ` / ${s.section}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-[rgba(148,163,184,0.06)] px-4 py-3 whitespace-nowrap">
                        <span className="text-[var(--heading)] font-medium">₹{s.expected_fee}</span>
                      </td>
                      <td className="border-b border-[rgba(148,163,184,0.06)] px-4 py-3 whitespace-nowrap">
                        <span className="text-[var(--text)]">{s.last_paid_label ?? '—'}</span>
                      </td>
                      <td className="border-b border-[rgba(148,163,184,0.06)] px-4 py-3 whitespace-nowrap">
                        {s.next_due_label ? (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            s.next_due_state === 'pending' ? 'theme-chip-warn' : 'theme-chip-neutral'
                          }`}>
                            {s.next_due_label}
                          </span>
                        ) : (
                          <span className="text-xs text-green-400 font-medium">✓ Fully Paid</span>
                        )}
                      </td>
                      <td className="border-b border-[rgba(148,163,184,0.06)] px-4 py-3 whitespace-nowrap text-right">
                        {Number(s.pending) > 0 ? (
                          <span className="font-semibold text-[var(--heading)]">₹{s.pending}</span>
                        ) : (
                          <span className="text-[var(--muted)]">—</span>
                        )}
                      </td>
                      <td className="border-b border-[rgba(148,163,184,0.06)] px-4 py-3 text-center">
                        <Link
                          href={`/students/${s.id}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--muted)] transition-colors hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
                          title="View profile"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--muted)]">
                      No students found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-[var(--muted)]">
            Page {page} of {totalPages} • {query.data?.total ?? 0} total
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Student</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((v) => createStudent.mutate(v))}>
            <DialogBody>
              <div className="grid gap-4">
                <div>
                  <label className="theme-heading mb-1.5 block text-sm font-medium">Roll Number</label>
                  <Input {...form.register('student_code')} placeholder="e.g. 101" />
                </div>
                <div>
                  <label className="theme-heading mb-1.5 block text-sm font-medium">Student Name</label>
                  <Input {...form.register('name')} placeholder="Full name" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="theme-heading mb-1.5 block text-sm font-medium">Class</label>
                    <Input {...form.register('class_name')} placeholder="e.g. 10" />
                  </div>
                  <div>
                    <label className="theme-heading mb-1.5 block text-sm font-medium">Section</label>
                    <Input {...form.register('section')} placeholder="e.g. A" />
                  </div>
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createStudent.isPending}>
                {createStudent.isPending ? <Spinner className="mr-2" /> : null}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
