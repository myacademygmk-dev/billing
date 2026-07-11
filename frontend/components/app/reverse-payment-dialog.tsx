'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toaster';
import { apiFetch } from '@/lib/api';

export type PaymentRow = {
  id: string;
  receipt_no: string;
  amount: string;
  mode: string;
};

const schema = z.object({
  reason: z.string().min(1, 'Please provide a reason for the reversal').max(300),
  amount: z
    .union([z.string().length(0), z.coerce.number().refine((v) => v !== 0, 'Amount must be non-zero')])
    .optional(),
});

type Values = z.infer<typeof schema>;

export function ReversePaymentDialog({
  open,
  onOpenChange,
  payment,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  payment: PaymentRow | null;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { reason: '', amount: '' },
  });

  // Reset form when payment changes
  useEffect(() => {
    if (open) form.reset({ reason: '', amount: '' });
  }, [open, form]);

  const reverse = useMutation({
    mutationFn: async (values: Values) => {
      if (!payment) throw new Error('No payment selected');
      const body: Record<string, unknown> = { reason: values.reason };
      if (typeof values.amount === 'number') body.amount = values.amount;
      return apiFetch(`/payments/${payment.id}/reverse`, { method: 'POST', body: JSON.stringify(body) });
    },
    onSuccess: () => {
      toast({ title: 'Payment reversed', description: `Receipt ${payment?.receipt_no} has been reversed.`, variant: 'success' });
      form.reset();
      onOpenChange(false);
      onSuccess();
    },
    onError: (e) => toast({ title: 'Reversal failed', description: String(e), variant: 'error' }),
  });

  function formatCurrency(value: string) {
    const num = parseFloat(value);
    return isNaN(num) ? '₹0' : `₹${Math.abs(num).toLocaleString('en-IN')}`;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--danger-soft)]">
              <AlertTriangle size={20} className="text-[var(--danger)]" />
            </div>
            <div>
              <DialogTitle>Reverse Payment</DialogTitle>
              <DialogDescription>
                This will create a negative entry and release the paid months.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogBody>
          {payment && (
            <div className="mb-4 rounded-xl border border-[var(--panel-line)] bg-[var(--surface-subtle)] px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">Receipt</span>
                <span className="font-mono font-medium text-[var(--heading)]">{payment.receipt_no}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">Amount</span>
                <span className="font-semibold text-[var(--heading)]">{formatCurrency(payment.amount)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">Mode</span>
                <span className="capitalize text-[var(--heading)]">{payment.mode}</span>
              </div>
            </div>
          )}

          <form id="reverse-form" onSubmit={form.handleSubmit((v) => reverse.mutate(v))} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">
                Reason for reversal *
              </label>
              <Input
                placeholder="e.g. Duplicate payment, wrong student..."
                {...form.register('reason')}
                error={form.formState.errors.reason?.message}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">
                Partial amount (optional)
              </label>
              <Input
                type="number"
                placeholder="Leave empty for full reversal"
                {...form.register('amount')}
                prefix={<span className="text-sm">₹</span>}
              />
              <p className="mt-1 text-xs text-[var(--muted)]">
                Leave blank to reverse the full amount of {payment ? formatCurrency(payment.amount) : '₹0'}
              </p>
            </div>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={reverse.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="reverse-form"
            variant="destructive"
            loading={reverse.isPending}
          >
            Reverse Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
