'use client';

import { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { AppShell } from '@/components/app/shell';
import { PaymentReceiptDialog } from '@/components/app/payment-receipt-dialog';
import { ReversePaymentDialog, type PaymentRow } from '@/components/app/reverse-payment-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SkeletonTable } from '@/components/ui/skeleton';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { EmptyState, EmptyStateIcon } from '@/components/ui/empty-state';
import { apiFetch } from '@/lib/api';
import { debounce } from '@/lib/debounce';

type Payment = {
  id: string;
  receipt_no: string;
  bill_no: string;
  academic_period: string;
  student_id: string;
  student_name?: string | null;
  paid_at: string;
  mode: string;
  amount: string;
  notes?: string | null;
  fee_period_label?: string | null;
  created_by_name?: string | null;
};

function formatCurrency(value: string) {
  const num = parseFloat(value);
  if (isNaN(num)) return '₹0';
  const prefix = num < 0 ? '-' : '+';
  return `${prefix}₹${Math.abs(num).toLocaleString('en-IN')}`;
}

export default function TransactionsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [mode, setMode] = useState('');
  const [billNo, setBillNo] = useState('');
  const [debouncedBillNo, setDebouncedBillNo] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [reverseOpen, setReverseOpen] = useState(false);
  const [reversePayment, setReversePayment] = useState<PaymentRow | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptPaymentId, setReceiptPaymentId] = useState<string | null>(null);

  const setBillNoDebounced = useMemo(() => debounce((v: string) => setDebouncedBillNo(v), 250), []);

  const q = useQuery({
    queryKey: ['payments', from, to, mode, debouncedBillNo, page],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      if (from) params.set('from', new Date(from).toISOString());
      if (to) params.set('to', new Date(to).toISOString());
      if (mode) params.set('mode', mode);
      if (debouncedBillNo) params.set('bill_no', debouncedBillNo);
      return apiFetch<{ items: Payment[]; total: number }>(`/payments?${params.toString()}`);
    },
  });

  const totalPages = q.data ? Math.max(1, Math.ceil(q.data.total / pageSize)) : 1;

  return (
    <AppShell
      title="Transactions"
      subtitle="View, filter, and manage all payment transactions."
      action={
        <Link
          href={`/api/backend/export/payments.csv?${new URLSearchParams({
            ...(from && { from: new Date(from).toISOString() }),
            ...(to && { to: new Date(to).toISOString() }),
          }).toString()}`}
          target="_blank"
        >
          <Button>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Filters - single inline row */}
        <div className="flex flex-wrap items-center gap-2">
          <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="h-8 w-[130px] text-xs" placeholder="From" />
          <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="h-8 w-[130px] text-xs" placeholder="To" />
          <Select
            value={mode}
            onChange={(e) => { setMode(e.target.value); setPage(1); }}
            className="h-8 w-[110px] text-xs"
          >
            <option value="">All Modes</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="bank">Bank</option>
          </Select>
          <Input
            value={billNo}
            onChange={(e) => {
              setBillNo(e.target.value);
              setBillNoDebounced(e.target.value);
              setPage(1);
            }}
            placeholder="Bill #"
            prefix={<Search size={12} />}
            className="h-8 w-[120px] text-xs"
          />
          {(from || to || mode || billNo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFrom('');
                setTo('');
                setMode('');
                setBillNo('');
                setDebouncedBillNo('');
                setPage(1);
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Pagination info + controls (top) */}
        {q.data && q.data.total > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted)]">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, q.data.total)} of {q.data.total} transactions
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-[var(--muted)]">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        {q.isLoading ? (
          <SkeletonTable rows={8} cols={6} />
        ) : q.isError ? (
          <div className="flex flex-col items-center py-12">
            <p className="text-sm text-[var(--danger)]">Failed to load transactions</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => q.refetch()}>
              Retry
            </Button>
          </div>
        ) : !q.data?.items.length ? (
          <EmptyState
            icon={<EmptyStateIcon type="payments" />}
            title="No transactions found"
            description={from || to || mode || billNo ? 'Try adjusting your filters' : 'Fee payments will appear here once collected'}
          />
        ) : (
          <div className="theme-table-wrap overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <tr>
                    <TH>Bill #</TH>
                    <TH>Receipt</TH>
                    <TH>Student</TH>
                    <TH>Period</TH>
                    <TH>Amount</TH>
                    <TH>Mode</TH>
                    <TH>Date</TH>
                    <TH>By</TH>
                    <TH className="text-right">Actions</TH>
                  </tr>
                </THead>
                <TBody>
                  {q.data.items.map((p) => {
                    const isNegative = parseFloat(p.amount) < 0;
                    return (
                      <TR key={p.id}>
                        <TD className="font-mono text-xs font-semibold text-[var(--heading)]">{p.bill_no}</TD>
                        <TD className="font-mono text-xs">{p.receipt_no}</TD>
                        <TD>
                          <div className="font-medium text-[var(--heading)]">{p.student_name ?? '-'}</div>
                        </TD>
                        <TD>
                          {p.fee_period_label ? (
                            <Badge variant="default">{p.fee_period_label}</Badge>
                          ) : (
                            <span className="text-[var(--muted)]">-</span>
                          )}
                        </TD>
                        <TD>
                          <span className={isNegative ? 'font-semibold text-[var(--danger)]' : 'font-semibold text-[var(--heading)]'}>
                            {formatCurrency(p.amount)}
                          </span>
                        </TD>
                        <TD>
                          <Badge variant={p.mode === 'cash' ? 'default' : p.mode === 'upi' ? 'accent' : 'success'}>
                            {p.mode}
                          </Badge>
                        </TD>
                        <TD className="whitespace-nowrap text-[var(--muted)]">
                          {new Date(p.paid_at).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TD>
                        <TD className="text-[var(--muted)]">{p.created_by_name ?? '-'}</TD>
                        <TD className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setReceiptPaymentId(p.id);
                                setReceiptOpen(true);
                              }}
                              aria-label={`View receipt for ${p.receipt_no}`}
                            >
                              Receipt
                            </Button>
                            {!isNegative && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-[var(--danger)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
                                onClick={() => {
                                  setReversePayment({ id: p.id, receipt_no: p.receipt_no, amount: p.amount, mode: p.mode });
                                  setReverseOpen(true);
                                }}
                                aria-label={`Reverse payment ${p.receipt_no}`}
                              >
                                Reverse
                              </Button>
                            )}
                          </div>
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      <ReversePaymentDialog open={reverseOpen} onOpenChange={setReverseOpen} payment={reversePayment} onSuccess={() => q.refetch()} />
      <PaymentReceiptDialog open={receiptOpen} onOpenChange={setReceiptOpen} paymentId={receiptPaymentId} />
    </AppShell>
  );
}
