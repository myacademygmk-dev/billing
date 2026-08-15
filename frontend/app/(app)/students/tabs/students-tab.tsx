'use client';

import Link from 'next/link';
import { Download, Eye, IndianRupee, MoreHorizontal, Pencil, Phone, Plus, Search, Users, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState, EmptyStateIcon } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toaster';
import { apiFetch } from '@/lib/api';
import { debounce } from '@/lib/debounce';

type StudentListItem = {
  id: string;
  student_code: string;
  name: string;
  class_name: string | null;
  status: 'active' | 'inactive';
  expected_fee: string;
  paid_total: string;
  pending: string;
  last_paid_label: string | null;
  next_due_label: string | null;
  next_due_state: 'pending' | 'upcoming' | null;
};

type ListResp = { items: StudentListItem[]; total: number };

const PAGE_SIZE = 25;

const createSchema = z.object({
  student_code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  class_name: z.string().max(100).optional(),
  school_name: z.string().max(300).optional(),
  date_of_birth: z.string().optional(),
  joined_date: z.string().optional(),
  gender: z.string().optional(),
  contact_no: z.string().max(20).optional(),
  parent_phone: z.string().max(20).optional(),
  parent_phone_2: z.string().max(20).optional(),
  whatsapp_no: z.string().max(20).optional(),
  father_name: z.string().max(200).optional(),
  mother_name: z.string().max(200).optional(),
  father_occupation: z.string().max(200).optional(),
  mother_occupation: z.string().max(200).optional(),
  hobbies: z.string().max(500).optional(),
  student_email: z.string().max(200).optional(),
  address: z.string().max(500).optional(),
  expected_fee: z.string().optional(),
  payment_period: z.string().optional(),
  batch: z.string().max(20).optional(),
});

type CreateValues = z.infer<typeof createSchema>;

export default function StudentsTab() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('active');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);
  const [bulkForm, setBulkForm] = useState({ class_name: '', expected_fee_amount: '', batch: '' });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { toast } = useToast();
  const qc = useQueryClient();
  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { student_code: '', name: '', class_name: '', school_name: '', gender: '', contact_no: '', parent_phone: '', parent_phone_2: '', whatsapp_no: '', father_name: '', mother_name: '', father_occupation: '', mother_occupation: '', hobbies: '', student_email: '', address: '', expected_fee: '', payment_period: '', batch: '' },
  });

  const setDebouncedFn = useMemo(() => debounce((v: string) => setDebounced(v), 250), []);
  useEffect(() => setDebouncedFn(search), [search, setDebouncedFn]);

  // Fetch classes for filter dropdown
  const classesQuery = useQuery({
    queryKey: ['student-classes'],
    queryFn: () => apiFetch<string[]>('/students/classes'),
    staleTime: 5 * 60 * 1000,
  });


  // Main student list query
  const query = useQuery({
    queryKey: ['students', debounced, selectedClass, page, status],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debounced) params.set('search', debounced);
      if (selectedClass) params.set('class_code', selectedClass);
      if (status !== 'all') params.set('status', status);
      params.set('page', String(page));
      params.set('page_size', String(PAGE_SIZE));
      return apiFetch<ListResp>(`/students/balances?${params.toString()}`);
    },
  });

  const createStudent = useMutation({
    mutationFn: (values: CreateValues) =>
      apiFetch<StudentListItem>('/students', { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: () => {
      toast({ title: 'Student created' });
      setCreateOpen(false);
      form.reset();
      qc.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (e) => toast({ title: 'Create failed', description: String(e) }),
  });

  async function handleBulkEdit() {
    const ids = Array.from(selectedIds);
    const payload: Record<string, unknown> = {};
    if (bulkForm.class_name.trim()) payload.class_name = bulkForm.class_name.trim();
    if (bulkForm.batch.trim()) payload.batch = bulkForm.batch.trim();

    if (Object.keys(payload).length === 0 && !bulkForm.expected_fee_amount.trim()) {
      toast({ title: 'No fields to update', description: 'Fill at least one field.' });
      return;
    }

    setBulkProgress({ current: 0, total: ids.length });
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < ids.length; i++) {
      setBulkProgress({ current: i + 1, total: ids.length });
      try {
        if (Object.keys(payload).length > 0) {
          await apiFetch(`/students/${ids[i]}`, { method: 'PATCH', body: JSON.stringify(payload) });
        }
        if (bulkForm.expected_fee_amount.trim()) {
          await apiFetch(`/students/${ids[i]}/fee`, {
            method: 'PATCH',
            body: JSON.stringify({ expected_fee_amount: Number(bulkForm.expected_fee_amount) }),
          });
        }
        successCount++;
      } catch {
        errorCount++;
      }
    }

    setBulkProgress(null);
    setBulkEditOpen(false);
    setBulkForm({ class_name: '', expected_fee_amount: '', batch: '' });
    setSelectedIds(new Set());
    qc.invalidateQueries({ queryKey: ['students'] });

    if (errorCount === 0) {
      toast({ title: `Updated ${successCount} students`, variant: 'success' });
    } else {
      toast({ title: `Updated ${successCount}, failed ${errorCount}`, variant: 'warning' });
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (!query.data?.items) return;
    const allIds = query.data.items.map((s) => s.id);
    const allSelected = allIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  }

  function clearFilters() {
    setSearch('');
    setDebounced('');
    setSelectedClass('');
    setStatus('active');
    setPage(1);
  }

  const totalPages = query.data ? Math.max(1, Math.ceil(query.data.total / PAGE_SIZE)) : 1;
  const totalStudents = query.data?.total ?? 0;
  const showingFrom = totalStudents > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const showingTo = Math.min(page * PAGE_SIZE, totalStudents);
  const hasActiveFilters = debounced || selectedClass || selectedSection || status !== 'active';

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* ─── Filter Bar ─── */}
      <div className="flex flex-col gap-2 sm:gap-3">
        {/* Search + Filters + Actions (single row) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[180px] max-w-[260px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search..."
              className="h-8 pl-10 text-sm"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setDebounced(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Class filter */}
          <Select
            className="h-8 w-auto min-w-[100px] max-w-[130px] text-xs"
            value={selectedClass}
            onChange={(e) => { setSelectedClass(e.target.value); setPage(1); }}
          >
            <option value="">All Classes</option>
            {classesQuery.data?.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>

          {/* Status filter */}
          <Select
            className="h-8 w-auto min-w-[80px] max-w-[110px] text-xs"
            value={status}
            onChange={(e) => { setStatus(e.target.value as 'all' | 'active' | 'inactive'); setPage(1); }}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All</option>
          </Select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-1.5">
            {selectedIds.size > 0 && (
              <Button size="sm" variant="outline" onClick={() => setBulkEditOpen(true)}>
                <Pencil className="h-3 w-3" />
                Bulk Edit ({selectedIds.size})
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => window.location.assign('/api/backend/export/students.xlsx')}>
              <Download className="h-3 w-3" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3 w-3" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="mt-3 -mx-3 sm:-mx-4 flex-1 min-h-0 overflow-auto">
        <table className="w-full text-[13px] text-[var(--text)]">
          <thead className="sticky top-0 z-10 bg-[var(--table-head-bg)] backdrop-blur">
            <tr>
              <th className="whitespace-nowrap border-b border-[rgba(148,163,184,0.12)] px-3 py-2.5 text-center w-[36px]">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded accent-[var(--accent)]"
                  checked={!!query.data?.items.length && query.data.items.every((s) => selectedIds.has(s.id))}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="whitespace-nowrap border-b border-[rgba(148,163,184,0.12)] px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Roll No</th>
              <th className="whitespace-nowrap border-b border-[rgba(148,163,184,0.12)] px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Student</th>
              <th className="whitespace-nowrap border-b border-[rgba(148,163,184,0.12)] px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Class</th>
              <th className="whitespace-nowrap border-b border-[rgba(148,163,184,0.12)] px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {query.isLoading ? (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
                    <Spinner /> Loading students...
                  </div>
                </td>
              </tr>
            ) : query.isError ? (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-sm text-rose-400">
                  Failed to load students
                </td>
              </tr>
            ) : query.data?.items.length ? (
              query.data.items.map((s, idx) => (
                <tr
                  key={s.id}
                  className={`group transition-colors duration-100 hover:bg-[var(--table-row-hover)] ${
                    idx % 2 === 1 ? 'bg-[var(--surface-subtle)]' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td className="border-b border-[rgba(148,163,184,0.06)] px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded accent-[var(--accent)]"
                      checked={selectedIds.has(s.id)}
                      onChange={() => toggleSelect(s.id)}
                    />
                  </td>

                  {/* Roll No */}
                  <td className="border-b border-[rgba(148,163,184,0.06)] px-3 py-2 whitespace-nowrap font-mono text-[11px] text-[var(--muted)]">
                    {s.student_code}
                  </td>

                  {/* Student Name */}
                  <td className="border-b border-[rgba(148,163,184,0.06)] px-3 py-2 whitespace-nowrap">
                    <span className="font-medium text-[var(--heading)]">{s.name}</span>
                  </td>

                  {/* Class badge */}
                  <td className="border-b border-[rgba(148,163,184,0.06)] px-3 py-2 whitespace-nowrap">
                    {s.class_name ? (
                      <span className="inline-flex items-center rounded-md bg-[var(--chip-neutral-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--chip-neutral-text)]">
                        {s.class_name}
                      </span>
                    ) : (
                      <span className="text-[var(--muted)]">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="border-b border-[rgba(148,163,184,0.06)] px-2 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Link
                        href={`/students/${s.id}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
                        title="View Profile"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href={`/collect?student_id=${s.id}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[rgba(22,163,74,0.1)] hover:text-[var(--success)]"
                        title="Collect Fee"
                      >
                        <IndianRupee className="h-3.5 w-3.5" />
                      </Link>
                      <a
                        href={`https://wa.me/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[rgba(22,163,74,0.1)] hover:text-green-600"
                        title="WhatsApp"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    compact
                    icon={<EmptyStateIcon type="search" size={32} />}
                    title="No students found"
                    description={hasActiveFilters ? 'Try adjusting your search or filters' : 'Add your first student using the Add button above'}
                    action={
                      hasActiveFilters ? (
                        <Button size="sm" variant="outline" onClick={clearFilters}>
                          Clear Filters
                        </Button>
                      ) : undefined
                    }
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Pagination ─── */}
      {totalStudents > 0 && (
        <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-[var(--panel-line)]">
          <span className="text-xs text-[var(--muted)]">
            Showing <span className="font-medium text-[var(--text)]">{showingFrom}–{showingTo}</span> of{' '}
            <span className="font-medium text-[var(--text)]">{totalStudents}</span> students
          </span>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Prev
            </Button>
            {/* Page number buttons */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`h-7 min-w-[28px] rounded-full px-2 text-xs font-medium transition-colors ${
                    pageNum === page
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text)]'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ─── Create Student Dialog ─── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Add Student</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((v) => createStudent.mutate(v))}>
            <DialogBody className="max-h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Roll Number *</label>
                    <Input {...form.register('student_code')} placeholder="e.g. 0601" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Student Name *</label>
                    <Input {...form.register('name')} placeholder="Full name" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Class</label>
                    <Input {...form.register('class_name')} placeholder="e.g. VI" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">School</label>
                    <Input {...form.register('school_name')} placeholder="School name" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Gender</label>
                    <select {...form.register('gender')} className="h-9 w-full rounded-lg border border-[var(--field-border)] bg-[var(--field-bg)] px-3 text-sm">
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">D.O.B</label>
                    <Input type="date" {...form.register('date_of_birth')} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">D.O.Join</label>
                    <Input type="date" {...form.register('joined_date')} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Contact No</label>
                    <Input {...form.register('contact_no')} placeholder="Student phone" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Father Name</label>
                    <Input {...form.register('father_name')} placeholder="Father name" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Mother Name</label>
                    <Input {...form.register('mother_name')} placeholder="Mother name" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Father Phone</label>
                    <Input {...form.register('parent_phone')} placeholder="Father phone" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Mother Phone</label>
                    <Input {...form.register('parent_phone_2')} placeholder="Mother phone" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">WhatsApp No</label>
                    <Input {...form.register('whatsapp_no')} placeholder="WhatsApp" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Father Occupation</label>
                    <Input {...form.register('father_occupation')} placeholder="Occupation" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Mother Occupation</label>
                    <Input {...form.register('mother_occupation')} placeholder="Occupation" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Hobbies</label>
                    <Input {...form.register('hobbies')} placeholder="Cricket, Drawing..." />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
                    <Input {...form.register('student_email')} placeholder="student@email.com" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Address</label>
                  <Input {...form.register('address')} placeholder="Full address" />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Fee (₹)</label>
                    <Input type="number" {...form.register('expected_fee')} placeholder="Monthly fee" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Period</label>
                    <select {...form.register('payment_period')} className="h-9 w-full rounded-lg border border-[var(--field-border)] bg-[var(--field-bg)] px-3 text-sm">
                      <option value="">Select</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Half Yearly">Half Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Batch</label>
                    <Input {...form.register('batch')} placeholder="2025-2026" />
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

      {/* ─── Bulk Edit Dialog ─── */}
      <Dialog open={bulkEditOpen} onOpenChange={(v) => { if (!bulkProgress) setBulkEditOpen(v); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Edit — {selectedIds.size} student{selectedIds.size > 1 ? 's' : ''}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="mb-4 text-sm text-[var(--muted)]">
              Only non-empty fields will be applied to all selected students.
            </p>
            <div className="grid gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Class</label>
                <Input
                  value={bulkForm.class_name}
                  onChange={(e) => setBulkForm({ ...bulkForm, class_name: e.target.value })}
                  placeholder="Leave empty to skip"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Monthly Fee Amount</label>
                <Input
                  type="number"
                  value={bulkForm.expected_fee_amount}
                  onChange={(e) => setBulkForm({ ...bulkForm, expected_fee_amount: e.target.value })}
                  placeholder="Leave empty to skip"
                  prefix={<span className="text-sm">₹</span>}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Batch</label>
                <Input
                  value={bulkForm.batch}
                  onChange={(e) => setBulkForm({ ...bulkForm, batch: e.target.value })}
                  placeholder="e.g. 2025-26"
                />
              </div>
            </div>
            {bulkProgress && (
              <div className="mt-4">
                <div className="mb-1.5 text-sm font-medium text-[var(--heading)]">
                  Updating {bulkProgress.current}/{bulkProgress.total} students...
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--field-bg)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-all duration-200"
                    style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEditOpen(false)} disabled={!!bulkProgress}>Cancel</Button>
            <Button onClick={handleBulkEdit} disabled={!!bulkProgress} loading={!!bulkProgress}>
              Apply to {selectedIds.size} Student{selectedIds.size > 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
