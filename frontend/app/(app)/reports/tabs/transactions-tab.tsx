'use client';

import { useMemo, useState } from 'react';
import { Download, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { PaymentReceiptDialog } from '@/components/app/payment-receipt-dialog';
import { ReversePaymentDialog, type PaymentRow } from '@/components/app/reverse-payment-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, EmptyStateIcon } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Table, TBody, TD, TH, THead } from '@/components/ui/table';
import { apiFetch } from '@/lib/api';
import { debounce } from '@/lib/debounce';

type Payment = {
  id: string;
  receipt_no: string;
  bill_no: string;
  student_name?: string | null;
  paid_at: string;
  mode: string;
  amount: string;
  notes?: string | null;
  fee_period_label?: string | null;
  created_by_name?: string | null;
};

export default function TransactionsTab() {
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
      return apiFetch<{ items: Payment[]; total: number }>(`/payments?${params}`);
    },
  });

  const totalPages = q.data ? Math.max(1, Math.ceil(q.data.total / pageSize)) : 1;
  const exportHref = `/api/backend/export/payments.csv${from ? `?from=${new Date(from).toISOString()}` : ''}${to ? `${from ? '&' : '?'}to=${new Date(to).toISOString()}` : ''}`;

  return (
    <div className="page-grid">
      <div className="flex flex-wrap gap-3">
        <Input className="h-9 w-[140px] rounded-lg" type="date" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From" />
        <Input className="h-9 w-[140px] rounded-lg" type="date" value={to} onChange={(e) => setTo(e.target.value)} placeholder="To" />
        <select className="theme-select h-9 rounded-lg px-3 text-sm" value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="">All Modes</option>
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="bank">Bank</option>
        </select>
        <Input className="h-9 w-[100px] rounded-lg" value={billNo} onChange={(e) => { setBillNo(e.target.value); setBillNoDebounced(e.target.value); }} placeholder="Bill No" />
        <Button size="sm" variant="outline" onClick={() => window.location.assign(exportHref)}><Download className="mr-1 h-3.5 w-3.5" />Export</Button>
      </div>

      {q.isLoading ? (
        <div className="flex items-center gap-2 py-8"><Spinner /> Loading</div>
      ) : !q.data?.items.length ? (
        <EmptyState icon={<EmptyStateIcon type="payments" />} title="No transactions yet" description="Fee payments will appear here once collected" />
      ) : (
        <Card square>
          <CardContent>
            <div className="overflow-auto max-h-[60vh]">
              <Table>
                <THead><tr><TH>Bill</TH><TH>Receipt</TH><TH>Date</TH><TH>Student</TH><TH>Period</TH><TH>Mode</TH><TH>Amount</TH><TH>By</TH><TH></TH></tr></THead>
                <TBody>
                  {q.data.items.map((p) => (
                    <tr key={p.id}>
                      <TD className="font-semibold">{p.bill_no}</TD>
                      <TD>{p.receipt_no}</TD>
                      <TD>{new Date(p.paid_at).toLocaleDateString()}</TD>
                      <TD>{p.student_name ?? '-'}</TD>
                      <TD>{p.fee_period_label ?? '-'}</TD>
                      <TD className="capitalize">{p.mode}</TD>
                      <TD className={Number(p.amount) < 0 ? 'text-rose-400 font-semibold' : 'font-semibold'}>{p.amount}</TD>
                      <TD className="text-[var(--muted)]">{p.created_by_name ?? '-'}</TD>
                      <TD>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => { setReceiptPaymentId(p.id); setReceiptOpen(true); }}>Receipt</Button>
                          <Button size="sm" variant="outline" onClick={() => { setReversePayment({ id: p.id, receipt_no: p.receipt_no, amount: p.amount, mode: p.mode }); setReverseOpen(true); }}>Reverse</Button>
                        </div>
                      </TD>
                    </tr>
                  ))}
                </TBody>
              </Table>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-[var(--muted)]">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <PaymentReceiptDialog open={receiptOpen} onOpenChange={setReceiptOpen} paymentId={receiptPaymentId} />
      <ReversePaymentDialog open={reverseOpen} onOpenChange={setReverseOpen} payment={reversePayment} onSuccess={() => q.refetch()} />
    </div>
  );
}
