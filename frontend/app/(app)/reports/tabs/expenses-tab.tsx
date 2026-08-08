'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState, EmptyStateIcon } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Table, TBody, TD, TH, THead } from '@/components/ui/table';
import { useToast } from '@/components/ui/toaster';
import { apiFetch } from '@/lib/api';

const CATEGORIES = ['rent', 'salary', 'electricity', 'stationery', 'maintenance', 'transport', 'other'];

type ExpenseItem = {
  id: string;
  title: string;
  amount: string;
  category?: string | null;
  expense_month: string;
  notes?: string | null;
};

type ExpenseMonthly = {
  month: string;
  month_label: string;
  income_total: string;
  expense_total: string;
  net_total: string;
  items: ExpenseItem[];
};

export default function ExpensesTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: '', notes: '' });

  const expenses = useQuery<ExpenseMonthly>({
    queryKey: ['expenses', month],
    queryFn: () => apiFetch(`/expenses/monthly?month=${month}-01`),
    enabled: month.length === 7,
  });

  const createExpense = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      // Append to existing items
      const existingItems = expenses.data?.items.map(i => ({ title: i.title, amount: Number(i.amount), notes: i.notes || null })) || [];
      const newItems = [...existingItems, data];
      return apiFetch('/expenses/monthly', { method: 'PUT', body: JSON.stringify({ month: `${month}-01`, items: newItems }) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); setShowAdd(false); setForm({ title: '', amount: '', category: '', notes: '' }); toast({ title: 'Expense added' }); },
    onError: (e) => toast({ title: 'Failed', description: String(e.message || e) }),
  });

  const total = expenses.data?.items.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

  // Group by category
  const byCategory: Record<string, number> = {};
  expenses.data?.items.forEach((e) => {
    const cat = e.category || 'other';
    byCategory[cat] = (byCategory[cat] || 0) + Number(e.amount);
  });

  return (
    <div className="page-grid">
      {/* Income / Expense / Savings Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2">
          <div className="text-[10px] font-medium uppercase text-green-600">Income (Fees)</div>
          <div className="text-lg font-bold text-green-700">₹{expenses.data?.income_total ?? '0'}</div>
        </div>
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2">
          <div className="text-[10px] font-medium uppercase text-red-600">Expenses</div>
          <div className="text-lg font-bold text-red-700">₹{expenses.data?.expense_total ?? '0'}</div>
        </div>
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
          <div className="text-[10px] font-medium uppercase text-blue-600">Savings</div>
          <div className={`text-lg font-bold ${Number(expenses.data?.net_total ?? 0) < 0 ? 'text-red-600' : 'text-blue-700'}`}>₹{expenses.data?.net_total ?? '0'}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Input className="h-9 w-[160px] rounded-lg" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="mr-1 h-3.5 w-3.5" />Add Expense</Button>
      </div>

      {/* Category Summary */}
      {Object.keys(byCategory).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
            <div key={cat} className="rounded-lg border border-[var(--panel-line)] bg-[var(--surface-subtle)] px-3 py-2">
              <div className="text-[10px] font-semibold uppercase text-[var(--muted)]">{cat}</div>
              <div className="text-sm font-bold text-[var(--heading)]">₹{amt.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      {expenses.isLoading ? (
        <div className="flex items-center gap-2 py-8"><Spinner /> Loading</div>
      ) : !expenses.data?.items.length ? (
        <EmptyState
          icon={<EmptyStateIcon type="data" />}
          title="No expenses this month"
          description="Track rent, salary, electricity, and other expenses here"
          action={<Button onClick={() => setShowAdd(true)}><Plus className="mr-1 h-3.5 w-3.5" />Add Expense</Button>}
        />
      ) : (
        <Card square>
          <CardContent>
            <div className="overflow-auto">
              <Table>
                <THead><tr><TH>Title</TH><TH>Category</TH><TH>Amount</TH><TH>Notes</TH></tr></THead>
                <TBody>
                  {expenses.data.items.map((e) => (
                    <tr key={e.id}>
                      <TD className="font-semibold">{e.title}</TD>
                      <TD><span className="rounded bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--accent)] capitalize">{e.category || 'other'}</span></TD>
                      <TD className="font-semibold">₹{Number(e.amount).toLocaleString()}</TD>
                      <TD className="text-[var(--muted)]">{e.notes ?? '-'}</TD>
                    </tr>
                  ))}
                </TBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <DialogBody>
            <div className="grid gap-3">
              <Input placeholder="Title (e.g. Electricity Bill) *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Input placeholder="Amount *" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <select className="theme-select w-full rounded-xl px-4 py-2.5 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Select Category</option>
                {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
              <Input placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button
              onClick={() => createExpense.mutate({ expense_month: `${month}-01`, title: form.title, amount: Number(form.amount), category: form.category || null, notes: form.notes || null })}
              disabled={!form.title || !form.amount}
            >Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
