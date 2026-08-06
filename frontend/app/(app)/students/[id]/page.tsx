'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AppShell } from '@/components/app/shell';
import { PaymentReceiptDialog } from '@/components/app/payment-receipt-dialog';
import { ReversePaymentDialog, type PaymentRow } from '@/components/app/reverse-payment-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Table, TBody, TD, TH, THead } from '@/components/ui/table';
import { useToast } from '@/components/ui/toaster';
import { apiFetch } from '@/lib/api';

type Student = {
  id: string;
  student_code: string;
  name: string;
  class_name: string | null;
  section: string | null;
  status: 'active' | 'inactive' | 'passed_out' | 'withdrawn' | 'transferred';
  date_of_birth?: string | null;
  gender?: string | null;
  blood_group?: string | null;
  photo_url?: string | null;
  admission_no?: string | null;
  father_name?: string | null;
  mother_name?: string | null;
  guardian_name?: string | null;
  parent_phone?: string | null;
  parent_phone_2?: string | null;
  parent_email?: string | null;
  parent_occupation?: string | null;
  whatsapp_no?: string | null;
  address?: string | null;
  city?: string | null;
  pincode?: string | null;
  previous_school?: string | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;
  joined_date?: string | null;
  batch?: string | null;
  notes?: string | null;
};

type Fee = {
  student_id: string;
  expected_fee_amount: string;
};

type Balance = {
  student_id: string;
  student_code: string;
  name: string;
  expected_fee: string;
  paid_total: string;
  pending: string;
};

type BillingMonth = {
  month: string;
  label: string;
  is_paid: boolean;
  receipt_no?: string | null;
};

type BillingOverview = {
  monthly_fee: string;
  cycle_label: string;
  cycle_months: number;
  payable_amount: string;
  batch?: string | null;
  batch_start_month: number;
  batch_start_label: string;
  batch_end_label: string;
  next_unpaid_label: string;
  pending_months: BillingMonth[];
};

type Payment = {
  id: string;
  receipt_no: string;
  paid_at: string;
  mode: string;
  amount: string;
  notes?: string | null;
  fee_period_label?: string | null;
};

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const { toast } = useToast();
  const qc = useQueryClient();
  const [feeOpen, setFeeOpen] = useState(false);
  const [inactiveOpen, setInactiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptPaymentId, setReceiptPaymentId] = useState<string | null>(null);
  const pageSize = 25;

  const [reverseOpen, setReverseOpen] = useState(false);
  const [reversePayment, setReversePayment] = useState<PaymentRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const feeSchema = z.object({ expected_fee_amount: z.coerce.number().min(0) });
  const feeForm = useForm<{ expected_fee_amount: number }>({
    resolver: zodResolver(feeSchema),
    defaultValues: { expected_fee_amount: 0 }
  });

  const editSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200),
    class_name: z.string().max(100).optional().or(z.literal('')),
    section: z.string().max(50).optional().or(z.literal('')),
    student_code: z.string().min(1, 'Roll number is required').max(50),
    serial_no: z.coerce.number().int().positive().optional().or(z.literal(0)).or(z.literal(undefined as unknown as number)),
    father_name: z.string().max(200).optional().or(z.literal('')),
    mother_name: z.string().max(200).optional().or(z.literal('')),
    parent_phone: z.string().max(20).optional().or(z.literal('')),
    whatsapp_no: z.string().max(20).optional().or(z.literal('')),
    date_of_birth: z.string().optional().or(z.literal('')),
    gender: z.string().optional().or(z.literal('')),
    blood_group: z.string().max(10).optional().or(z.literal('')),
    address: z.string().max(500).optional().or(z.literal('')),
    city: z.string().max(100).optional().or(z.literal('')),
    pincode: z.string().max(10).optional().or(z.literal('')),
    notes: z.string().max(1000).optional().or(z.literal('')),
  });
  type EditValues = z.infer<typeof editSchema>;
  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {}
  });

  const student = useQuery({ queryKey: ['student', id], queryFn: () => apiFetch<Student>(`/students/${id}`) });
  const fee = useQuery({ queryKey: ['studentFee', id], queryFn: () => apiFetch<Fee>(`/students/${id}/fee`) });
  const balance = useQuery({ queryKey: ['studentBalance', id], queryFn: () => apiFetch<Balance>(`/students/${id}/balance`) });
  const overview = useQuery({
    queryKey: ['studentBillingOverview', id],
    queryFn: () => apiFetch<BillingOverview>(`/students/${id}/billing-overview`)
  });
  const payments = useQuery({
    queryKey: ['payments', id, page],
    queryFn: () => apiFetch<{ items: Payment[]; total: number }>(`/payments?student_id=${id}&page=${page}&page_size=${pageSize}`)
  });

  const paymentTotalPages = payments.data ? Math.max(1, Math.ceil(payments.data.total / pageSize)) : 1;

  const updateFee = useMutation({
    mutationFn: (values: { expected_fee_amount: number }) =>
      apiFetch<Fee>(`/students/${id}/fee`, { method: 'PATCH', body: JSON.stringify(values) }),
    onSuccess: () => {
      toast({ title: 'Monthly fee updated' });
      setFeeOpen(false);
      qc.invalidateQueries({ queryKey: ['studentFee', id] });
      qc.invalidateQueries({ queryKey: ['studentBalance', id] });
      qc.invalidateQueries({ queryKey: ['studentBillingOverview', id] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (e) => toast({ title: 'Update failed', description: String(e) })
  });

  const inactivate = useMutation({
    mutationFn: () => apiFetch<Student>(`/students/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'inactive' }) }),
    onSuccess: () => {
      toast({ title: 'Student inactivated' });
      setInactiveOpen(false);
      qc.invalidateQueries({ queryKey: ['student', id] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (e) => toast({ title: 'Action failed', description: String(e) })
  });

  const hardDelete = useMutation({
    mutationFn: async () => {
      await apiFetch(`/students/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({ title: 'Student permanently deleted' });
      router.push('/students');
    },
    onError: (e) => toast({ title: 'Delete failed', description: String(e) })
  });

  const editStudent = useMutation({
    mutationFn: (values: Partial<EditValues>) =>
      apiFetch<Student>(`/students/${id}`, { method: 'PATCH', body: JSON.stringify(values) }),
    onSuccess: () => {
      toast({ title: 'Student updated', variant: 'success' });
      setEditOpen(false);
      qc.invalidateQueries({ queryKey: ['student', id] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (e) => toast({ title: 'Update failed', description: String(e) })
  });

  function openEditDialog() {
    const s = student.data;
    if (!s) return;
    editForm.reset({
      name: s.name ?? '',
      class_name: s.class_name ?? '',
      section: s.section ?? '',
      student_code: s.student_code ?? '',
      serial_no: undefined,
      father_name: s.father_name ?? '',
      mother_name: s.mother_name ?? '',
      parent_phone: s.parent_phone ?? '',
      whatsapp_no: s.whatsapp_no ?? '',
      date_of_birth: s.date_of_birth ?? '',
      gender: s.gender ?? '',
      blood_group: s.blood_group ?? '',
      address: s.address ?? '',
      city: s.city ?? '',
      pincode: s.pincode ?? '',
      notes: s.notes ?? '',
    });
    setEditOpen(true);
  }

  function handleEditSubmit(values: EditValues) {
    // Only send changed fields
    const s = student.data;
    if (!s) return;
    const changed: Record<string, unknown> = {};
    if (values.name !== s.name) changed.name = values.name;
    if (values.class_name !== (s.class_name ?? '')) changed.class_name = values.class_name || null;
    if (values.section !== (s.section ?? '')) changed.section = values.section || null;
    if (values.student_code !== s.student_code) changed.student_code = values.student_code;
    if (values.serial_no) changed.serial_no = values.serial_no;
    if (values.father_name !== (s.father_name ?? '')) changed.father_name = values.father_name || null;
    if (values.mother_name !== (s.mother_name ?? '')) changed.mother_name = values.mother_name || null;
    if (values.parent_phone !== (s.parent_phone ?? '')) changed.parent_phone = values.parent_phone || null;
    if (values.whatsapp_no !== (s.whatsapp_no ?? '')) changed.whatsapp_no = values.whatsapp_no || null;
    if (values.date_of_birth !== (s.date_of_birth ?? '')) changed.date_of_birth = values.date_of_birth || null;
    if (values.gender !== (s.gender ?? '')) changed.gender = values.gender || null;
    if (values.blood_group !== (s.blood_group ?? '')) changed.blood_group = values.blood_group || null;
    if (values.address !== (s.address ?? '')) changed.address = values.address || null;
    if (values.city !== (s.city ?? '')) changed.city = values.city || null;
    if (values.pincode !== (s.pincode ?? '')) changed.pincode = values.pincode || null;
    if (values.notes !== (s.notes ?? '')) changed.notes = values.notes || null;

    if (Object.keys(changed).length === 0) {
      toast({ title: 'No changes to save' });
      setEditOpen(false);
      return;
    }
    editStudent.mutate(changed as Partial<EditValues>);
  }

  return (
    <AppShell title="Student Profile" subtitle="Review fee settings, pending months, and full payment history for this student.">
      {student.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-[#91a1bc]">
          <Spinner /> Loading
        </div>
      ) : student.isError ? (
        <div className="text-sm text-rose-300">Student not found</div>
      ) : (
        <div className="space-y-4">
          <Card square>
            <CardHeader>
              <CardTitle>
                {student.data?.name} <span className="text-[#7f8da9]">({student.data?.student_code})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <div className="text-sm text-[#91a1bc]">
                {student.data?.class_name ?? '-'} {student.data?.section ?? ''}
              </div>
              <Badge className={student.data?.status === 'active' ? 'bg-[rgba(46,216,143,0.16)] text-[#48e69b]' : 'bg-[rgba(151,164,187,0.08)] text-[#9aa8c2]'}>
                {student.data?.status}
              </Badge>
            </CardContent>
          </Card>

          {/* Profile Details */}
          <Card square>
            <CardHeader><CardTitle>Profile Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                {student.data?.date_of_birth && <div><span className="text-[var(--muted)]">Date of Birth:</span> <span className="font-medium">{student.data.date_of_birth}</span></div>}
                {student.data?.gender && <div><span className="text-[var(--muted)]">Gender:</span> <span className="font-medium capitalize">{student.data.gender}</span></div>}
                {student.data?.blood_group && <div><span className="text-[var(--muted)]">Blood Group:</span> <span className="font-medium">{student.data.blood_group}</span></div>}
                {student.data?.admission_no && <div><span className="text-[var(--muted)]">Admission No:</span> <span className="font-medium">{student.data.admission_no}</span></div>}
                {student.data?.joined_date && <div><span className="text-[var(--muted)]">Joined:</span> <span className="font-medium">{student.data.joined_date}</span></div>}
                {student.data?.batch && <div><span className="text-[var(--muted)]">Batch:</span> <span className="font-medium">{student.data.batch}</span></div>}
                {student.data?.father_name && <div><span className="text-[var(--muted)]">Father:</span> <span className="font-medium">{student.data.father_name}</span></div>}
                {student.data?.mother_name && <div><span className="text-[var(--muted)]">Mother:</span> <span className="font-medium">{student.data.mother_name}</span></div>}
                {student.data?.guardian_name && <div><span className="text-[var(--muted)]">Guardian:</span> <span className="font-medium">{student.data.guardian_name}</span></div>}
                {student.data?.parent_phone && <div><span className="text-[var(--muted)]">Parent Phone:</span> <span className="font-medium">{student.data.parent_phone}</span></div>}
                {student.data?.parent_phone_2 && <div><span className="text-[var(--muted)]">Phone 2:</span> <span className="font-medium">{student.data.parent_phone_2}</span></div>}
                {student.data?.whatsapp_no && <div><span className="text-[var(--muted)]">WhatsApp:</span> <span className="font-medium">{student.data.whatsapp_no}</span></div>}
                {student.data?.parent_email && <div><span className="text-[var(--muted)]">Email:</span> <span className="font-medium">{student.data.parent_email}</span></div>}
                {student.data?.parent_occupation && <div><span className="text-[var(--muted)]">Occupation:</span> <span className="font-medium">{student.data.parent_occupation}</span></div>}
                {student.data?.address && <div className="sm:col-span-2"><span className="text-[var(--muted)]">Address:</span> <span className="font-medium">{student.data.address}{student.data.city ? `, ${student.data.city}` : ''}{student.data.pincode ? ` - ${student.data.pincode}` : ''}</span></div>}
                {student.data?.previous_school && <div className="sm:col-span-2"><span className="text-[var(--muted)]">Previous School:</span> <span className="font-medium">{student.data.previous_school}</span></div>}
                {student.data?.emergency_contact && <div><span className="text-[var(--muted)]">Emergency:</span> <span className="font-medium">{student.data.emergency_contact} {student.data.emergency_phone ? `(${student.data.emergency_phone})` : ''}</span></div>}
                {student.data?.notes && <div className="sm:col-span-3"><span className="text-[var(--muted)]">Notes:</span> <span className="font-medium">{student.data.notes}</span></div>}
              </div>
              {!student.data?.father_name && !student.data?.date_of_birth && !student.data?.parent_phone && (
                <p className="mt-2 text-sm text-[var(--muted)]">No additional profile details available. Update student to add parent info, DOB, address, etc.</p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card square>
              <CardHeader>
                <CardTitle>Monthly Fee</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{fee.data?.expected_fee_amount ?? '0'}</CardContent>
            </Card>
            <Card square>
              <CardHeader>
                <CardTitle>Cycle Amount</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{overview.data?.payable_amount ?? '0'}</CardContent>
            </Card>
            <Card square>
              <CardHeader>
                <CardTitle>Paid Total</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{balance.data?.paid_total ?? '0'}</CardContent>
            </Card>
            <Card square>
              <CardHeader>
                <CardTitle>Next Unpaid</CardTitle>
              </CardHeader>
              <CardContent className="text-lg font-semibold">{overview.data?.next_unpaid_label ?? '-'}</CardContent>
            </Card>
          </div>

          <Card square>
            <CardHeader>
              <CardTitle>Billing Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-[#91a1bc]">
                Current period: {overview.data?.cycle_label} ({overview.data?.cycle_months ?? 0} months)
              </div>
              <div className="text-sm text-[#91a1bc]">
                Batch window: {overview.data?.batch_start_label} - {overview.data?.batch_end_label}
              </div>
              <div className="flex flex-wrap gap-2">
                {overview.data?.pending_months.length ? (
                  overview.data.pending_months.map((month) => (
                    <Badge key={month.month} className="bg-[rgba(255,177,74,0.14)] text-[#ffbf6e]">
                      {month.label}
                    </Badge>
                  ))
                ) : (
                  <div className="text-sm text-[#91a1bc]">No pending months in the current billing window.</div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Link href={`/collect?student_id=${id}`}>
              <Button>Collect Payment</Button>
            </Link>
            <Button variant="outline" onClick={openEditDialog}>
              Edit Profile
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                feeForm.setValue('expected_fee_amount', Number(fee.data?.expected_fee_amount ?? 0));
                setFeeOpen(true);
              }}
            >
              Edit Monthly Fee
            </Button>
            {student.data?.status === 'active' ? (
              <Button variant="destructive" onClick={() => setInactiveOpen(true)}>
                Mark Inactive
              </Button>
            ) : (
              <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                Permanently Delete
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => window.location.assign(`/api/backend/export/payments.csv?student_id=${id}`)}
            >
              Export Payments CSV
            </Button>
          </div>

          <Card square>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto rounded-[24px] border border-[rgba(151,164,187,0.08)] bg-[rgba(255,255,255,0.02)]">
                <Table>
                  <THead>
                    <tr>
                      <TH>Receipt</TH>
                      <TH>Fee Period</TH>
                      <TH>Date</TH>
                      <TH>Mode</TH>
                      <TH>Amount</TH>
                      <TH>Notes</TH>
                      <TH></TH>
                    </tr>
                  </THead>
                  <TBody>
                    {payments.isLoading ? (
                      <tr>
                        <TD colSpan={7}>
                          <div className="flex items-center gap-2 text-sm text-[#91a1bc]">
                            <Spinner /> Loading
                          </div>
                        </TD>
                      </tr>
                    ) : payments.isError ? (
                      <tr>
                        <TD colSpan={7} className="text-sm text-rose-300">
                          Failed to load payments
                        </TD>
                      </tr>
                    ) : payments.data?.items.length ? (
                      payments.data.items.map((p) => (
                        <tr key={p.id}>
                          <TD>{p.receipt_no}</TD>
                          <TD>{p.fee_period_label ?? '-'}</TD>
                          <TD>{new Date(p.paid_at).toLocaleString()}</TD>
                          <TD>{p.mode}</TD>
                          <TD className={Number(p.amount) < 0 ? 'font-semibold text-rose-300' : 'font-semibold text-white'}>{p.amount}</TD>
                          <TD className="max-w-[320px] truncate" title={p.notes ?? ''}>
                            {p.notes ?? ''}
                          </TD>
                          <TD>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReceiptPaymentId(p.id);
                                  setReceiptOpen(true);
                                }}
                              >
                                Receipt
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReversePayment({ id: p.id, receipt_no: p.receipt_no, amount: p.amount, mode: p.mode });
                                  setReverseOpen(true);
                                }}
                              >
                                Reverse
                              </Button>
                            </div>
                          </TD>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <TD colSpan={7} className="text-sm text-[#91a1bc]">
                          No payments
                        </TD>
                      </tr>
                    )}
                  </TBody>
                </Table>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-[#91a1bc]">
                  Page {page} / {paymentTotalPages}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= paymentTotalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Dialog open={feeOpen} onOpenChange={setFeeOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Monthly Fee</DialogTitle>
              </DialogHeader>
              <form onSubmit={feeForm.handleSubmit((v) => updateFee.mutate(v))}>
                <DialogBody>
                  <div>
                    <div className="mb-2 text-sm font-medium text-[#dbe6ff]">Monthly Fee</div>
                    <input
                      type="number"
                      step="0.01"
                      className="h-12 w-full rounded-2xl border border-[rgba(151,164,187,0.14)] bg-[rgba(255,255,255,0.04)] px-4 text-sm text-white outline-none"
                      {...feeForm.register('expected_fee_amount')}
                    />
                    {feeForm.formState.errors.expected_fee_amount ? (
                      <div className="mt-1 text-xs text-rose-300">{feeForm.formState.errors.expected_fee_amount.message}</div>
                    ) : null}
                  </div>
                </DialogBody>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setFeeOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateFee.isPending}>
                    {updateFee.isPending ? <Spinner className="mr-2" /> : null}
                    Save
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={inactiveOpen} onOpenChange={setInactiveOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mark Student Inactive</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <div className="text-sm text-[#91a1bc]">
                  This keeps all billing history but removes the student from the active list. Only inactive students become eligible for permanent deletion.
                </div>
              </DialogBody>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setInactiveOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="destructive" onClick={() => inactivate.mutate()} disabled={inactivate.isPending}>
                  {inactivate.isPending ? <Spinner className="mr-2" /> : null}
                  Mark Inactive
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Permanently Delete Student</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <div className="text-sm text-[#91a1bc]">
                  This permanently removes the inactive student record. The action is blocked if any payment history exists.
                </div>
              </DialogBody>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="destructive" onClick={() => hardDelete.mutate()} disabled={hardDelete.isPending}>
                  {hardDelete.isPending ? <Spinner className="mr-2" /> : null}
                  Delete Permanently
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <PaymentReceiptDialog open={receiptOpen} onOpenChange={setReceiptOpen} paymentId={receiptPaymentId} />

          {/* Edit Student Dialog */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Student Profile</DialogTitle>
              </DialogHeader>
              <form onSubmit={editForm.handleSubmit(handleEditSubmit)}>
                <DialogBody>
                  <div className="grid gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Name *</label>
                        <Input {...editForm.register('name')} error={editForm.formState.errors.name?.message} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Roll Number *</label>
                        <Input {...editForm.register('student_code')} error={editForm.formState.errors.student_code?.message} />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Class</label>
                        <Input {...editForm.register('class_name')} placeholder="e.g. 10" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Section</label>
                        <Input {...editForm.register('section')} placeholder="e.g. A" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Serial No</label>
                        <Input type="number" {...editForm.register('serial_no')} placeholder="Optional" />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Father Name</label>
                        <Input {...editForm.register('father_name')} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Mother Name</label>
                        <Input {...editForm.register('mother_name')} />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Parent Phone</label>
                        <Input {...editForm.register('parent_phone')} placeholder="Phone number" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">WhatsApp No</label>
                        <Input {...editForm.register('whatsapp_no')} placeholder="WhatsApp number" />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Date of Birth</label>
                        <Input type="date" {...editForm.register('date_of_birth')} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Gender</label>
                        <Select {...editForm.register('gender')}>
                          <option value="">—</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Blood Group</label>
                        <Input {...editForm.register('blood_group')} placeholder="e.g. O+" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Address</label>
                      <Input {...editForm.register('address')} placeholder="Street address" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">City</label>
                        <Input {...editForm.register('city')} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Pincode</label>
                        <Input {...editForm.register('pincode')} />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Notes</label>
                      <Input {...editForm.register('notes')} placeholder="Any additional notes" />
                    </div>
                  </div>
                </DialogBody>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                  <Button type="submit" loading={editStudent.isPending}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <ReversePaymentDialog
            open={reverseOpen}
            onOpenChange={setReverseOpen}
            payment={reversePayment}
            onSuccess={() => {
              payments.refetch();
              balance.refetch();
              overview.refetch();
            }}
          />
        </div>
      )}
    </AppShell>
  );
}
