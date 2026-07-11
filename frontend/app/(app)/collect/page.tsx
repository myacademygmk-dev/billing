'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AlertCircle, CreditCard, Search } from 'lucide-react';

import { AppShell } from '@/components/app/shell';
import { Receipt, type ReceiptData } from '@/components/app/receipt';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toaster';
import { apiFetch } from '@/lib/api';
import { debounce } from '@/lib/debounce';
import { cn } from '@/components/ui/cn';

type Student = {
  id: string;
  student_code: string;
  name: string;
  status: 'active' | 'inactive';
};

type BillingMonth = {
  month: string;
  label: string;
  is_paid: boolean;
  receipt_no?: string | null;
};

type BillingOverview = {
  student_id: string;
  monthly_fee: string;
  cycle_label: string;
  cycle_months: number;
  payable_amount: string;
  batch?: string | null;
  batch_start_month: number;
  batch_start_label: string;
  batch_end_label: string;
  next_unpaid_month: string;
  next_unpaid_label: string;
  pending_months: BillingMonth[];
  months: BillingMonth[];
};

type SearchResult = {
  id: string;
  student_code: string;
  name: string;
  pending: string;
  status: 'active' | 'inactive';
};

const schema = z.object({
  student_id: z.string().uuid().optional().or(z.literal('')),
  student_code: z.string().min(1, 'Roll number is required'),
  billing_start_month: z.string().optional(),
  mode: z.enum(['cash', 'upi', 'bank']),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function formatCurrency(amount: number | string) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN')}`;
}

export default function CollectPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const studentId = params.get('student_id') ?? '';
  const rollNoFromQuery = params.get('student_code') ?? '';
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [studentCodeLookup, setStudentCodeLookup] = useState(rollNoFromQuery);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [visibleCycleCount, setVisibleCycleCount] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<FormValues | null>(null);

  // Autocomplete search
  const [searchQuery, setSearchQuery] = useState(rollNoFromQuery);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const debounceFn = useMemo(() => debounce((v: string) => setDebouncedSearch(v), 300), []);
  useEffect(() => {
    debounceFn(searchQuery);
  }, [searchQuery, debounceFn]);

  const suggestions = useQuery({
    queryKey: ['studentSearch', debouncedSearch],
    enabled: debouncedSearch.trim().length >= 2 && showSuggestions,
    queryFn: () =>
      apiFetch<{ items: SearchResult[]; total: number }>(
        `/students/balances?search=${encodeURIComponent(debouncedSearch)}&status=active&page=1&page_size=6`
      ),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      student_id: studentId,
      student_code: rollNoFromQuery,
      billing_start_month: '',
      mode: 'cash',
      notes: '',
    },
  });

  useEffect(() => {
    form.setValue('student_id', studentId);
    if (rollNoFromQuery) {
      form.setValue('student_code', rollNoFromQuery);
      setStudentCodeLookup(rollNoFromQuery);
      setSearchQuery(rollNoFromQuery);
    }
  }, [form, rollNoFromQuery, studentId]);

  const student = useQuery({
    queryKey: ['studentByCode', studentCodeLookup],
    enabled: Boolean(studentCodeLookup),
    queryFn: async () => {
      const data = await apiFetch<{ items: Student[]; total: number }>(
        `/students?search=${encodeURIComponent(studentCodeLookup)}&page=1&page_size=10`
      );
      const exact = data.items.find((item) => item.student_code.toLowerCase() === studentCodeLookup.toLowerCase());
      if (!exact) throw new Error('Student not found for this roll number');
      form.setValue('student_id', exact.id);
      form.setValue('student_code', exact.student_code);
      return exact;
    },
  });
  const studentById = useQuery({
    queryKey: ['studentById', studentId],
    enabled: Boolean(studentId) && !Boolean(studentCodeLookup),
    queryFn: async () => {
      const data = await apiFetch<Student>(`/students/${studentId}`);
      form.setValue('student_id', data.id);
      form.setValue('student_code', data.student_code);
      setStudentCodeLookup(data.student_code);
      setSearchQuery(data.student_code);
      return data;
    },
  });
  const selectedStudent = student.data ?? studentById.data;
  const isStudentLoading = student.isLoading || studentById.isLoading;
  const isStudentError = student.isError || studentById.isError;

  const overview = useQuery({
    queryKey: ['studentBillingOverview', selectedStudent?.id],
    enabled: Boolean(selectedStudent?.id),
    queryFn: () => apiFetch<BillingOverview>(`/students/${selectedStudent?.id}/billing-overview`),
  });

  const selectedCycleMonths = overview.data?.cycle_months ?? 1;
  const payableAmount = overview.data ? (Number(overview.data.monthly_fee) * selectedMonths.length).toFixed(2) : '0.00';

  const carryForwardCount = useMemo(() => {
    if (!overview.data) return 0;
    const batchStart = overview.data.months[0]?.month;
    const firstPending = overview.data.pending_months[0]?.month;
    if (!batchStart || !firstPending) return 0;
    const batchStartDate = new Date(batchStart);
    const firstPendingDate = new Date(firstPending);
    const pendingOffset =
      (firstPendingDate.getUTCFullYear() - batchStartDate.getUTCFullYear()) * 12 +
      (firstPendingDate.getUTCMonth() - batchStartDate.getUTCMonth());
    return (selectedCycleMonths - (pendingOffset % selectedCycleMonths)) % selectedCycleMonths;
  }, [overview.data, selectedCycleMonths]);

  const visiblePendingMonths = useMemo(() => {
    if (!overview.data) return [];
    const visibleCount = carryForwardCount + visibleCycleCount * selectedCycleMonths;
    return overview.data.pending_months.slice(0, visibleCount);
  }, [carryForwardCount, overview.data, selectedCycleMonths, visibleCycleCount]);

  const carryForwardMonths = useMemo(
    () => visiblePendingMonths.slice(0, carryForwardCount),
    [carryForwardCount, visiblePendingMonths]
  );
  const cycleMonths = useMemo(
    () => visiblePendingMonths.slice(carryForwardCount),
    [carryForwardCount, visiblePendingMonths]
  );

  useEffect(() => {
    if (!visiblePendingMonths.length) {
      setSelectedMonths([]);
      form.setValue('billing_start_month', '');
      return;
    }
    const initial = visiblePendingMonths.map((month) => month.month);
    setSelectedMonths(initial);
    setVisibleCycleCount(1);
    form.setValue('billing_start_month', initial[0] ?? '');
  }, [form, overview.data?.student_id]);

  const canLoadMoreCycles = Boolean(
    overview.data && visiblePendingMonths.length < overview.data.pending_months.length
  );

  function toggleMonth(month: string) {
    setSelectedMonths((current) => {
      const exists = current.includes(month);
      const next = exists ? current.filter((item) => item !== month) : [...current, month];
      const sorted = [...next].sort();
      form.setValue('billing_start_month', sorted[0] ?? '');
      return sorted;
    });
  }

  function selectStudent(result: SearchResult) {
    setStudentCodeLookup(result.student_code);
    setSearchQuery(result.student_code);
    form.setValue('student_code', result.student_code);
    form.setValue('student_id', result.id);
    setShowSuggestions(false);
  }

  function handlePaymentSubmit(values: FormValues) {
    // Show confirmation dialog before processing payment
    setPendingPayment(values);
    setConfirmOpen(true);
  }

  const createPayment = useMutation({
    mutationFn: (values: FormValues) =>
      apiFetch<ReceiptData>('/payments', {
        method: 'POST',
        body: JSON.stringify({
          ...values,
          billing_start_month: selectedMonths[0] ?? null,
          selected_months: selectedMonths,
        }),
      }),
    onSuccess: (data) => {
      toast({ title: 'Payment recorded', description: `Receipt: ${data.receipt_no}`, variant: 'success' });
      setReceipt(data);
      setConfirmOpen(false);
      setPendingPayment(null);
      qc.invalidateQueries({ queryKey: ['studentBillingOverview'] });
      qc.invalidateQueries({ queryKey: ['studentByCode'] });
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
      qc.invalidateQueries({ queryKey: ['recentPayments'] });
    },
    onError: (e) => {
      toast({ title: 'Payment failed', description: String(e), variant: 'error' });
      setConfirmOpen(false);
    },
  });

  return (
    <AppShell
      title={`Record Payment${overview.data?.batch ? ` (${overview.data.batch})` : ''}`}
      subtitle="Search student, review pending months, and record payment."
      backHref={selectedStudent?.id ? `/students/${selectedStudent.id}` : undefined}
      action={
        selectedStudent?.id ? (
          <Button variant="outline" onClick={() => router.push(`/students/${selectedStudent.id}`)}>
            View Student Profile
          </Button>
        ) : undefined
      }
    >
      {receipt ? (
        <div className="max-w-xl">
          <Receipt
            data={receipt}
            onClose={() => {
              setReceipt(null);
              router.push(`/students/${receipt.student_id}`);
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Left: Student Billing */}
          <Card>
            <CardHeader>
              <CardTitle>Student Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {studentCodeLookup ? (
                isStudentLoading || overview.isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <div className="grid grid-cols-3 gap-2.5">
                      <Skeleton className="h-16 rounded-xl" />
                      <Skeleton className="h-16 rounded-xl" />
                      <Skeleton className="h-16 rounded-xl" />
                    </div>
                    <Skeleton className="h-32 w-full rounded-xl" />
                  </div>
                ) : isStudentError || overview.isError ? (
                  <div className="flex items-center gap-2 rounded-xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
                    <AlertCircle size={16} />
                    Student not found or failed to load billing data.
                  </div>
                ) : (
                  <>
                    {/* Student info banner */}
                    <div className="theme-subtle-surface flex items-center justify-between gap-3 rounded-xl p-4">
                      <div className="min-w-0">
                        <div className="theme-heading truncate text-base font-semibold">
                          {selectedStudent?.name}
                        </div>
                        <div className="mt-0.5 text-sm text-[var(--muted)]">
                          Roll No: {selectedStudent?.student_code}
                        </div>
                      </div>
                      <Badge variant={selectedStudent?.status === 'active' ? 'success' : 'default'}>
                        {selectedStudent?.status}
                      </Badge>
                    </div>

                    {/* Billing summary cards */}
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      <div className="theme-subtle-surface rounded-xl px-4 py-3">
                        <div className="text-xs text-[var(--muted)]">Monthly Fee</div>
                        <div className="theme-heading mt-1 text-lg font-bold">
                          {formatCurrency(overview.data?.monthly_fee ?? '0')}
                        </div>
                      </div>
                      <div className="rounded-xl bg-[var(--accent-soft)] px-4 py-3">
                        <div className="text-xs text-[var(--accent)]">Payable Now</div>
                        <div className="theme-heading mt-1 text-lg font-bold">{formatCurrency(payableAmount)}</div>
                      </div>
                      <div className="theme-subtle-surface rounded-xl px-4 py-3">
                        <div className="text-xs text-[var(--muted)]">Next Due</div>
                        <div className="theme-heading mt-1 text-lg font-bold">
                          {overview.data?.next_unpaid_label}
                        </div>
                      </div>
                    </div>

                    {/* Month status grid */}
                    <div>
                      <div className="mb-2 text-sm font-medium text-[var(--heading)]">Month Status</div>
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
                        {overview.data?.months.map((month) => (
                          <div
                            key={month.month}
                            className={cn(
                              'rounded-lg border px-2.5 py-2 text-sm',
                              month.is_paid
                                ? 'border-transparent bg-[var(--chip-success-bg)] text-[var(--chip-success-text)]'
                                : 'border-[var(--panel-line)] bg-[var(--surface-subtle)] text-[var(--heading)]'
                            )}
                          >
                            <div className="font-medium">{month.label}</div>
                            <div className="mt-0.5 text-xs opacity-80">
                              {month.is_paid ? `Paid${month.receipt_no ? ` · ${month.receipt_no}` : ''}` : 'Pending'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )
              ) : (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--surface-subtle)] border border-[var(--panel-line)]">
                    <Search size={28} className="text-[var(--muted)]" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-[var(--heading)]">Search for a student</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Enter a roll number or name in the search field to begin
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right: Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[var(--accent)]" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={form.handleSubmit(handlePaymentSubmit)}>
                {/* Student search with autocomplete */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--heading)]">
                    Search Student
                  </label>
                  <div className="relative">
                    <Input
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        form.setValue('student_code', e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder="Type name or roll number..."
                      prefix={<Search size={16} />}
                    />
                    {/* Autocomplete dropdown */}
                    {showSuggestions && debouncedSearch.trim().length >= 2 && (
                      <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-[var(--panel-line)] bg-[var(--panel-strong)] shadow-lg">
                        {suggestions.isLoading ? (
                          <div className="flex items-center gap-2 px-4 py-3 text-sm text-[var(--muted)]">
                            <Spinner size="sm" /> Searching...
                          </div>
                        ) : !suggestions.data?.items.length ? (
                          <div className="px-4 py-3 text-sm text-[var(--muted)]">No students found</div>
                        ) : (
                          suggestions.data.items.map((result) => (
                            <button
                              key={result.id}
                              type="button"
                              className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--surface-subtle)]"
                              onMouseDown={() => selectStudent(result)}
                            >
                              <div className="min-w-0">
                                <div className="font-medium text-[var(--heading)]">{result.name}</div>
                                <div className="text-xs text-[var(--muted)]">{result.student_code}</div>
                              </div>
                              {parseFloat(result.pending) > 0 && (
                                <Badge variant="warning">{formatCurrency(result.pending)} due</Badge>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {!showSuggestions && searchQuery && !studentCodeLookup && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="mt-2"
                      onClick={() => setStudentCodeLookup(searchQuery.trim())}
                    >
                      Load Student
                    </Button>
                  )}
                  {isStudentError && (
                    <p className="mt-1.5 text-xs text-[var(--danger)]">Student not found for this roll number</p>
                  )}
                </div>

                {/* Month selection */}
                {visiblePendingMonths.length > 0 && (
                  <div className="space-y-3">
                    {carryForwardMonths.length > 0 && (
                      <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--chip-warn-text)]">
                          <AlertCircle size={12} />
                          Overdue Months
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {carryForwardMonths.map((month) => {
                            const active = selectedMonths.includes(month.month);
                            return (
                              <button
                                key={month.month}
                                type="button"
                                onClick={() => toggleMonth(month.month)}
                                aria-pressed={active}
                                className={cn(
                                  'min-w-[100px] rounded-xl border px-3 py-2.5 text-left text-sm transition-all',
                                  active
                                    ? 'border-[rgba(183,121,31,0.3)] bg-[var(--chip-warn-bg)] text-[var(--heading)] shadow-sm'
                                    : 'border-[var(--panel-line)] bg-[var(--surface-subtle)] text-[var(--muted)] hover:border-[rgba(183,121,31,0.2)]'
                                )}
                              >
                                <div className="font-medium">{month.label}</div>
                                <div className="mt-0.5 text-xs opacity-70">{active ? '✓ Selected' : 'Tap to select'}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {cycleMonths.length > 0 && (
                      <div>
                        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                          Current Cycle ({selectedCycleMonths} {selectedCycleMonths === 1 ? 'month' : 'months'})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {cycleMonths.map((month) => {
                            const active = selectedMonths.includes(month.month);
                            return (
                              <button
                                key={month.month}
                                type="button"
                                onClick={() => toggleMonth(month.month)}
                                aria-pressed={active}
                                className={cn(
                                  'min-w-[100px] rounded-xl border px-3 py-2.5 text-left text-sm transition-all',
                                  active
                                    ? 'border-[rgba(47,111,237,0.3)] bg-[var(--accent-soft)] text-[var(--heading)] shadow-sm'
                                    : 'border-[var(--panel-line)] bg-[var(--surface-subtle)] text-[var(--muted)] hover:border-[rgba(47,111,237,0.2)]'
                                )}
                              >
                                <div className="font-medium">{month.label}</div>
                                <div className="mt-0.5 text-xs opacity-70">{active ? '✓ Selected' : 'Tap to select'}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {canLoadMoreCycles && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setVisibleCycleCount((v) => v + 1)}>
                        + Show More Months
                      </Button>
                    )}
                  </div>
                )}

                {!visiblePendingMonths.length && selectedStudent && !overview.isLoading && (
                  <div className="rounded-xl bg-[var(--chip-success-bg)] px-4 py-3 text-sm text-[var(--chip-success-text)]">
                    ✓ All months are paid for this student
                  </div>
                )}

                {/* Payment mode */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--heading)]">Payment Mode</label>
                  <Select {...form.register('mode')}>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank">Bank Transfer</option>
                  </Select>
                </div>

                {/* Remarks */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--heading)]">Remarks (optional)</label>
                  <Input placeholder="Any additional notes..." {...form.register('notes')} />
                </div>

                {/* Summary & Submit */}
                {selectedMonths.length > 0 && selectedStudent && (
                  <div className="rounded-xl border border-[var(--panel-line)] bg-[var(--surface-subtle)] px-4 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--muted)]">{selectedMonths.length} month(s) × {formatCurrency(overview.data?.monthly_fee ?? '0')}</span>
                      <span className="text-lg font-bold text-[var(--heading)]">{formatCurrency(payableAmount)}</span>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createPayment.isPending || !selectedStudent?.id || selectedMonths.length === 0}
                  loading={createPayment.isPending}
                >
                  Confirm & Pay {selectedMonths.length > 0 ? formatCurrency(payableAmount) : ''}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Confirmation Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm Payment"
        description={`You're about to record a payment for ${selectedStudent?.name ?? 'this student'}.`}
        variant="default"
        confirmLabel={`Pay ${formatCurrency(payableAmount)}`}
        cancelLabel="Go Back"
        loading={createPayment.isPending}
        onConfirm={() => {
          if (pendingPayment) createPayment.mutate(pendingPayment);
        }}
      >
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Student</span>
            <span className="font-medium text-[var(--heading)]">{selectedStudent?.name} ({selectedStudent?.student_code})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Months</span>
            <span className="font-medium text-[var(--heading)]">{selectedMonths.length} month(s)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Mode</span>
            <span className="font-medium text-[var(--heading)] capitalize">{form.getValues('mode')}</span>
          </div>
          <div className="my-2 border-t border-[var(--panel-line)]" />
          <div className="flex justify-between">
            <span className="font-medium text-[var(--heading)]">Total Amount</span>
            <span className="text-lg font-bold text-[var(--accent)]">{formatCurrency(payableAmount)}</span>
          </div>
        </div>
      </ConfirmDialog>
    </AppShell>
  );
}
