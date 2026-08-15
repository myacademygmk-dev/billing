'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { EmptyState, EmptyStateIcon } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Table, TBody, TD, TH, THead } from '@/components/ui/table';
import { apiFetch } from '@/lib/api';

type SavingsBalance = {
  student_id: string;
  student_code: string;
  student_name: string;
  class_name: string | null;
  total_deposited: string;
  total_withdrawn: string;
  balance: string;
};

type SavingsEntry = {
  id: string;
  student_id: string;
  student_name: string | null;
  student_code: string | null;
  amount: string;
  notes: string | null;
  is_retraction: boolean;
  recorded_at: string;
  created_at: string;
};

export default function SavingsTab() {
  const [classFilter, setClassFilter] = useState('');
  const [view, setView] = useState<'balances' | 'transactions'>('balances');
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const classesQuery = useQuery<string[]>({
    queryKey: ['studentClasses'],
    queryFn: () => apiFetch('/students/classes'),
  });

  const balances = useQuery<{ items: SavingsBalance[] }>({
    queryKey: ['savingsBalances', classFilter],
    queryFn: () => apiFetch(`/savings/balances${classFilter ? `?class_name=${classFilter}` : ''}`),
    enabled: view === 'balances',
  });

  const entries = useQuery<{ items: SavingsEntry[]; total: number }>({
    queryKey: ['savingsEntries', month],
    queryFn: () => apiFetch(`/savings?page=1&page_size=200${month ? `&from=${month}-01T00:00:00&to=${month}-31T23:59:59` : ''}`),
    enabled: view === 'transactions' && month.length === 7,
  });

  // Calculate class-wise summary
  const classSummary: Record<string, { deposits: number; withdrawals: number; balance: number; count: number }> = {};
  if (balances.data?.items) {
    for (const item of balances.data.items) {
      const cls = item.class_name || 'Unknown';
      if (!classSummary[cls]) classSummary[cls] = { deposits: 0, withdrawals: 0, balance: 0, count: 0 };
      classSummary[cls].deposits += Number(item.total_deposited);
      classSummary[cls].withdrawals += Number(item.total_withdrawn);
      classSummary[cls].balance += Number(item.balance);
      classSummary[cls].count += 1;
    }
  }

  const totalDeposits = balances.data?.items.reduce((sum, i) => sum + Number(i.total_deposited), 0) ?? 0;
  const totalWithdrawals = balances.data?.items.reduce((sum, i) => sum + Number(i.total_withdrawn), 0) ?? 0;
  const totalBalance = balances.data?.items.reduce((sum, i) => sum + Number(i.balance), 0) ?? 0;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2">
          <div className="text-[10px] font-medium uppercase text-green-600">Total Deposits</div>
          <div className="text-lg font-bold text-green-700">₹{totalDeposits.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2">
          <div className="text-[10px] font-medium uppercase text-red-600">Total Withdrawals</div>
          <div className="text-lg font-bold text-red-700">₹{totalWithdrawals.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
          <div className="text-[10px] font-medium uppercase text-blue-600">Total Balance</div>
          <div className="text-lg font-bold text-blue-700">₹{totalBalance.toLocaleString()}</div>
        </div>
      </div>

      {/* View toggle + filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setView('balances')}
            className={`px-3 py-1.5 text-xs font-medium ${view === 'balances' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Balances
          </button>
          <button
            onClick={() => setView('transactions')}
            className={`px-3 py-1.5 text-xs font-medium ${view === 'transactions' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Transactions
          </button>
        </div>

        {view === 'balances' && (
          <Select
            className="h-8 w-auto min-w-[100px] text-xs"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="">All Classes</option>
            {classesQuery.data?.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        )}

        {view === 'transactions' && (
          <Input type="month" className="h-8 w-[150px] text-xs" value={month} onChange={(e) => setMonth(e.target.value)} />
        )}
      </div>

      {/* Class-wise Summary */}
      {view === 'balances' && !classFilter && Object.keys(classSummary).length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Class-wise Summary</h4>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(classSummary).sort((a, b) => a[0].localeCompare(b[0])).map(([cls, data]) => (
              <div key={cls} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">{cls}</span>
                  <span className="text-[10px] text-gray-500">{data.count} students</span>
                </div>
                <div className="mt-1.5 flex justify-between text-xs">
                  <span className="text-green-600">+₹{data.deposits.toLocaleString()}</span>
                  <span className="text-red-600">-₹{data.withdrawals.toLocaleString()}</span>
                  <span className="font-semibold text-blue-700">₹{data.balance.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Balances Table */}
      {view === 'balances' && (
        balances.isLoading ? (
          <div className="flex items-center gap-2 py-8 text-gray-500"><Spinner /> Loading...</div>
        ) : !balances.data?.items.length ? (
          <EmptyState compact icon={<EmptyStateIcon type="fees" />} title="No savings data" description="No savings entries found." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <tr>
                  <TH>Roll No</TH>
                  <TH>Student</TH>
                  <TH>Class</TH>
                  <TH className="text-right">Deposited</TH>
                  <TH className="text-right">Withdrawn</TH>
                  <TH className="text-right">Balance</TH>
                </tr>
              </THead>
              <TBody>
                {balances.data.items.map((item) => (
                  <tr key={item.student_id}>
                    <TD>{item.student_code}</TD>
                    <TD className="font-medium">{item.student_name}</TD>
                    <TD>{item.class_name || '-'}</TD>
                    <TD className="text-right text-green-700">₹{Number(item.total_deposited).toLocaleString()}</TD>
                    <TD className="text-right text-red-600">₹{Number(item.total_withdrawn).toLocaleString()}</TD>
                    <TD className="text-right font-semibold text-blue-700">₹{Number(item.balance).toLocaleString()}</TD>
                  </tr>
                ))}
              </TBody>
            </Table>
          </div>
        )
      )}

      {/* Transactions Table */}
      {view === 'transactions' && (
        entries.isLoading ? (
          <div className="flex items-center gap-2 py-8 text-gray-500"><Spinner /> Loading...</div>
        ) : !entries.data?.items.length ? (
          <EmptyState compact icon={<EmptyStateIcon type="fees" />} title="No transactions" description="No savings transactions for this month." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <tr>
                  <TH>Date</TH>
                  <TH>Student</TH>
                  <TH>Type</TH>
                  <TH className="text-right">Amount</TH>
                  <TH>Notes</TH>
                </tr>
              </THead>
              <TBody>
                {entries.data.items.map((entry) => (
                  <tr key={entry.id} className={entry.is_retraction ? 'opacity-50 line-through' : ''}>
                    <TD className="text-xs">{new Date(entry.recorded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</TD>
                    <TD className="font-medium">{entry.student_name || '-'}</TD>
                    <TD>
                      {Number(entry.amount) >= 0 ? (
                        <span className="inline-flex items-center rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700">Deposit</span>
                      ) : (
                        <span className="inline-flex items-center rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700">Withdrawal</span>
                      )}
                    </TD>
                    <TD className={`text-right font-medium ${Number(entry.amount) >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {Number(entry.amount) >= 0 ? '+' : ''}₹{Math.abs(Number(entry.amount)).toLocaleString()}
                    </TD>
                    <TD className="text-xs text-gray-500">{entry.notes || '-'}</TD>
                  </tr>
                ))}
              </TBody>
            </Table>
          </div>
        )
      )}
    </div>
  );
}
