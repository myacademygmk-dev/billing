'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppShell } from '@/components/app/shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState, EmptyStateIcon } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SkeletonTable } from '@/components/ui/skeleton';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { useToast } from '@/components/ui/toaster';
import { apiFetch } from '@/lib/api';

type FeeStructure = {
  id: string;
  name: string;
  amount: string;
  class_name?: string | null;
  academic_year?: string | null;
  is_recurring: boolean;
  is_active: boolean;
};
type FeeDiscount = {
  id: string;
  name: string;
  discount_type: string;
  value: string;
  description?: string | null;
  is_active: boolean;
};

export default function FeesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAddFee, setShowAddFee] = useState(false);
  const [showAddDiscount, setShowAddDiscount] = useState(false);
  const [feeForm, setFeeForm] = useState({ name: '', amount: '', class_name: '', academic_year: '', is_recurring: true });
  const [discountForm, setDiscountForm] = useState({ name: '', discount_type: 'percentage', value: '', description: '' });

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'fee' | 'discount'; id: string; name: string } | null>(null);

  const fees = useQuery<FeeStructure[]>({ queryKey: ['feeStructures'], queryFn: () => apiFetch('/fees/structures') });
  const discounts = useQuery<FeeDiscount[]>({ queryKey: ['feeDiscounts'], queryFn: () => apiFetch('/fees/discounts') });

  const createFee = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch('/fees/structures', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feeStructures'] });
      setShowAddFee(false);
      setFeeForm({ name: '', amount: '', class_name: '', academic_year: '', is_recurring: true });
      toast({ title: 'Fee structure created', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Failed', description: String(e.message || e), variant: 'error' }),
  });

  const deleteFee = useMutation({
    mutationFn: (id: string) => apiFetch(`/fees/structures/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feeStructures'] });
      toast({ title: 'Fee structure deleted', variant: 'success' });
      setDeleteTarget(null);
    },
    onError: (e) => {
      toast({ title: 'Delete failed', description: String(e), variant: 'error' });
      setDeleteTarget(null);
    },
  });

  const createDiscount = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch('/fees/discounts', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feeDiscounts'] });
      setShowAddDiscount(false);
      setDiscountForm({ name: '', discount_type: 'percentage', value: '', description: '' });
      toast({ title: 'Discount created', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Failed', description: String(e.message || e), variant: 'error' }),
  });

  const deleteDiscount = useMutation({
    mutationFn: (id: string) => apiFetch(`/fees/discounts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feeDiscounts'] });
      toast({ title: 'Discount removed', variant: 'success' });
      setDeleteTarget(null);
    },
    onError: (e) => {
      toast({ title: 'Delete failed', description: String(e), variant: 'error' });
      setDeleteTarget(null);
    },
  });

  return (
    <AppShell title="Fee Structure & Discounts" subtitle="Define fee types and concessions for students.">
      <div className="page-grid">
        {/* Fee Structures */}
        <Card square transparent>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Fee Structures</CardTitle>
              <Button size="sm" onClick={() => setShowAddFee(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Fee Type
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-0 sm:px-0">
            {fees.isLoading ? (
              <SkeletonTable rows={3} cols={5} />
            ) : !fees.data?.length ? (
              <EmptyState
                icon={<EmptyStateIcon type="fees" />}
                title="No fee structures"
                description="Add your first fee structure to start collecting fees."
                action={
                  <Button size="sm" onClick={() => setShowAddFee(true)}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add Fee Type
                  </Button>
                }
                compact
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <tr>
                      <TH>Name</TH>
                      <TH>Amount</TH>
                      <TH>Class</TH>
                      <TH>Year</TH>
                      <TH>Type</TH>
                      <TH className="text-right">Action</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {fees.data.map((f) => (
                      <TR key={f.id}>
                        <TD className="font-semibold text-[var(--heading)]">{f.name}</TD>
                        <TD>₹{parseFloat(f.amount).toLocaleString('en-IN')}</TD>
                        <TD>{f.class_name ?? <span className="text-[var(--muted)]">All</span>}</TD>
                        <TD>{f.academic_year ?? <span className="text-[var(--muted)]">-</span>}</TD>
                        <TD>
                          <Badge variant={f.is_recurring ? 'accent' : 'default'}>
                            {f.is_recurring ? 'Monthly' : 'One-time'}
                          </Badge>
                        </TD>
                        <TD className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                            onClick={() => setDeleteTarget({ type: 'fee', id: f.id, name: f.name })}
                            aria-label={`Delete ${f.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Discounts */}
        <Card square transparent>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Discounts & Concessions</CardTitle>
              <Button size="sm" onClick={() => setShowAddDiscount(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Discount
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-0 sm:px-0">
            {discounts.isLoading ? (
              <SkeletonTable rows={3} cols={4} />
            ) : !discounts.data?.length ? (
              <EmptyState
                icon={<EmptyStateIcon type="fees" />}
                title="No discounts configured"
                description="Add discounts or concessions that can be applied to student fees."
                action={
                  <Button size="sm" onClick={() => setShowAddDiscount(true)}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add Discount
                  </Button>
                }
                compact
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <tr>
                      <TH>Name</TH>
                      <TH>Type</TH>
                      <TH>Value</TH>
                      <TH>Description</TH>
                      <TH className="text-right">Action</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {discounts.data.map((d) => (
                      <TR key={d.id}>
                        <TD className="font-semibold text-[var(--heading)]">{d.name}</TD>
                        <TD>
                          <Badge variant="default">{d.discount_type === 'percentage' ? 'Percentage' : 'Fixed'}</Badge>
                        </TD>
                        <TD className="font-medium">
                          {d.discount_type === 'percentage' ? `${d.value}%` : `₹${parseFloat(d.value).toLocaleString('en-IN')}`}
                        </TD>
                        <TD className="text-[var(--muted)]">{d.description ?? '-'}</TD>
                        <TD className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                            onClick={() => setDeleteTarget({ type: 'discount', id: d.id, name: d.name })}
                            aria-label={`Delete ${d.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Fee Structure Dialog */}
      <Dialog open={showAddFee} onOpenChange={setShowAddFee}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Fee Structure</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="grid gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Fee Name *</label>
                <Input
                  placeholder="e.g. Tuition Fee"
                  value={feeForm.name}
                  onChange={(e) => setFeeForm({ ...feeForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Amount *</label>
                <Input
                  placeholder="e.g. 5000"
                  type="number"
                  min="0"
                  value={feeForm.amount}
                  onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                  prefix={<span className="text-sm">₹</span>}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Class (optional)</label>
                  <Input
                    placeholder="e.g. 10 or LKG"
                    value={feeForm.class_name}
                    onChange={(e) => setFeeForm({ ...feeForm, class_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Academic Year</label>
                  <Input
                    placeholder="e.g. 2025-2026"
                    value={feeForm.academic_year}
                    onChange={(e) => setFeeForm({ ...feeForm, academic_year: e.target.value })}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2.5 text-sm text-[var(--text)]">
                <input
                  type="checkbox"
                  checked={feeForm.is_recurring}
                  onChange={(e) => setFeeForm({ ...feeForm, is_recurring: e.target.checked })}
                  className="h-4 w-4 rounded"
                />
                <span>Monthly recurring fee</span>
                <span className="text-xs text-[var(--muted)]">(charged every month)</span>
              </label>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddFee(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                createFee.mutate({
                  ...feeForm,
                  amount: Number(feeForm.amount),
                  class_name: feeForm.class_name || null,
                  academic_year: feeForm.academic_year || null,
                })
              }
              disabled={!feeForm.name || !feeForm.amount}
              loading={createFee.isPending}
            >
              Create Fee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Discount Dialog */}
      <Dialog open={showAddDiscount} onOpenChange={setShowAddDiscount}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Discount</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="grid gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Discount Name *</label>
                <Input
                  placeholder="e.g. Sibling Discount"
                  value={discountForm.name}
                  onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Discount Type</label>
                <Select
                  value={discountForm.discount_type}
                  onChange={(e) => setDiscountForm({ ...discountForm, discount_type: e.target.value })}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Value *</label>
                <Input
                  placeholder={discountForm.discount_type === 'percentage' ? 'e.g. 10' : 'e.g. 500'}
                  type="number"
                  min="0"
                  value={discountForm.value}
                  onChange={(e) => setDiscountForm({ ...discountForm, value: e.target.value })}
                  prefix={<span className="text-sm">{discountForm.discount_type === 'percentage' ? '%' : '₹'}</span>}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Description (optional)</label>
                <Input
                  placeholder="Brief description of the discount"
                  value={discountForm.description}
                  onChange={(e) => setDiscountForm({ ...discountForm, description: e.target.value })}
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDiscount(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                createDiscount.mutate({
                  ...discountForm,
                  value: Number(discountForm.value),
                  description: discountForm.description || null,
                })
              }
              disabled={!discountForm.name || !discountForm.value}
              loading={createDiscount.isPending}
            >
              Create Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This action cannot be undone. The item will be permanently removed."
        variant="danger"
        confirmLabel="Delete"
        loading={deleteFee.isPending || deleteDiscount.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.type === 'fee') deleteFee.mutate(deleteTarget.id);
          else deleteDiscount.mutate(deleteTarget.id);
        }}
      />
    </AppShell>
  );
}
