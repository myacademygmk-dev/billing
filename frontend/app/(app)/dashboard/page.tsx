'use client';

import { useState } from 'react';
import { CheckCircle2, Download, UserX2, Users } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { AppShell } from '@/components/app/shell';
import { PaymentReceiptDialog } from '@/components/app/payment-receipt-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SkeletonMetricCards, SkeletonTable } from '@/components/ui/skeleton';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { EmptyState, EmptyStateIcon } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';

type Summary = {
  total_collected: string;
  today_total: string;
  month_total: string;
  pending_total: string;
  paid_students: number;
  unpaid_students: number;
  active_students: number;
  selected_month: string;
};

type Payment = {
  id: string;
  receipt_no: string;
  student_name?: string | null;
  student_code?: string | null;
  fee_period_label?: string | null;
  amount: string;
  paid_at: string;
  created_by_name?: string | null;
};

function toMonthDate(value: string) {
  if (!value) return `${new Date().toISOString().slice(0, 7)}-01`;
  return `${value}-01`;
}

function monthLabel(value: string) {
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export default function DashboardPage() {
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptPaymentId, setReceiptPaymentId] = useState<string | null>(null);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const summary = useQuery({
    queryKey: ['summary', month],
    queryFn: () => apiFetch<Summary>(`/reports/summary?month=${encodeURIComponent(toMonthDate(month))}`),
  });
  const recentPayments = useQuery({
    queryKey: ['recentPayments'],
    queryFn: () => apiFetch<{ items: Payment[]; total: number }>('/payments?page=1&page_size=5'),
  });

  const statCards = [
    {
      label: 'Total Students',
      value: summary.data?.active_students?.toString() ?? '-',
      caption: 'Active students enrolled',
      icon: Users,
      bg: 'bg-[var(--accent-soft)]',
      iconColor: 'text-[var(--accent)]',
    },
    {
      label: 'Students Paid',
      value: summary.data?.paid_students?.toString() ?? '-',
      caption: `Paid for ${monthLabel(month)}`,
      icon: CheckCircle2,
      bg: 'bg-[var(--chip-success-bg)]',
      iconColor: 'text-[var(--success)]',
    },
    {
      label: 'Students Not Paid',
      value: summary.data?.unpaid_students?.toString() ?? '-',
      caption: `Pending for ${monthLabel(month)}`,
      icon: UserX2,
      bg: 'bg-[var(--chip-warn-bg)]',
      iconColor: 'text-[var(--warn)]',
    },
  ];

  return (
    <AppShell
      title="Dashboard"
      subtitle="Monitor payments, pending dues, and activity across your institution."
      action={
        <div className="flex flex-wrap gap-3">
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-[180px]" />
          <Link href="/api/backend/export/pending.csv" target="_blank">
            <Button variant="outline">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </Link>
        </div>
      }
    >
      <div className="page-grid">
        {/* Stat Cards */}
        {summary.isLoading ? (
          <SkeletonMetricCards count={3} className="lg:grid-cols-3" />
        ) : summary.isError ? (
          <div className="glass-panel rounded-2xl p-6 text-center">
            <p className="text-sm text-[var(--danger)]">Failed to load summary. Please try refreshing.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => summary.refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {statCards.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label} className="metric-card">
                  <CardContent className="space-y-4 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-medium text-[var(--text-secondary)]">{item.label}</div>
                        <div className="theme-heading mt-2 text-2xl font-bold sm:text-3xl">{item.value}</div>
                      </div>
                      <div className={`rounded-xl p-3 ${item.bg}`}>
                        <Icon className={`h-5 w-5 ${item.iconColor}`} />
                      </div>
                    </div>
                    <div className="text-xs text-[var(--muted)]">{item.caption}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Recent Fee Payments */}
        <Card square>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Fee Payments</CardTitle>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Latest payment activity</p>
            </div>
            <Link href="/reports?tab=transactions">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-0 sm:px-0">
            {recentPayments.isLoading ? (
              <SkeletonTable rows={4} cols={5} />
            ) : recentPayments.isError ? (
              <div className="px-6 py-6 text-center">
                <p className="text-sm text-[var(--danger)]">Failed to load recent payments</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => recentPayments.refetch()}>
                  Retry
                </Button>
              </div>
            ) : !recentPayments.data?.items.length ? (
              <EmptyState
                icon={<EmptyStateIcon type="payments" />}
                title="No payments yet"
                description="Recent fee payments will appear here once recorded."
                compact
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <tr>
                      <TH>Student</TH>
                      <TH>Receipt</TH>
                      <TH>Amount</TH>
                      <TH>Period</TH>
                      <TH>Date</TH>
                      <TH className="text-right">Action</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {recentPayments.data.items.map((payment) => {
                      const isNegative = parseFloat(payment.amount) < 0;
                      return (
                        <TR key={payment.id}>
                          <TD>
                            <div className="font-medium text-[var(--heading)]">{payment.student_name ?? '-'}</div>
                            <div className="text-xs text-[var(--muted)]">{payment.student_code ?? ''}</div>
                          </TD>
                          <TD>
                            <span className="font-mono text-xs">{payment.receipt_no}</span>
                          </TD>
                          <TD>
                            <span className={isNegative ? 'text-[var(--danger)]' : 'text-[var(--success)]'}>
                              {isNegative ? '-' : '+'}₹{Math.abs(parseFloat(payment.amount)).toLocaleString('en-IN')}
                            </span>
                          </TD>
                          <TD>
                            {payment.fee_period_label ? (
                              <Badge variant="default">{payment.fee_period_label}</Badge>
                            ) : (
                              '-'
                            )}
                          </TD>
                          <TD className="text-[var(--muted)]">
                            {new Date(payment.paid_at).toLocaleDateString(undefined, {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </TD>
                          <TD className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setReceiptPaymentId(payment.id);
                                setReceiptOpen(true);
                              }}
                            >
                              Receipt
                            </Button>
                          </TD>
                        </TR>
                      );
                    })}
                  </TBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <PaymentReceiptDialog open={receiptOpen} onOpenChange={setReceiptOpen} paymentId={receiptPaymentId} />
      </div>
    </AppShell>
  );
}
