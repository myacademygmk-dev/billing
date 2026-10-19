'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StudentPicker, type PickedStudent } from './student-picker';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toaster';
import { apiFetch } from '@/lib/api';

export function ApplyFeeDialog({ fee, onClose }: { fee: { name: string; amount: string; class_name?: string | null }; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [student, setStudent] = useState<PickedStudent | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [saved, setSaved] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();
  const currentFee = useQuery({ queryKey: ['studentFee', student?.id], enabled: !!student, queryFn: () => apiFetch<{ expected_fee_amount: string }>(`/students/${student?.id}/fee`) });
  const apply = useMutation({
    mutationFn: () => apiFetch(`/students/${student?.id}/fee`, { method: 'PATCH', body: JSON.stringify({ expected_fee_amount: Number(fee.amount) }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['studentFee'] }); qc.invalidateQueries({ queryKey: ['students'] }); qc.invalidateQueries({ queryKey: ['studentBalance'] }); qc.invalidateQueries({ queryKey: ['studentBillingOverview'] }); setSaved(true); toast({ title: 'Monthly fee applied', variant: 'success' }); },
    onError: (error) => toast({ title: 'Fee could not be applied', description: String(error), variant: 'error' }),
  });
  return <Dialog open onOpenChange={(open) => { if (!open && !apply.isPending) onClose(); }}><DialogContent>
    <DialogHeader><DialogTitle>Apply {fee.name}</DialogTitle></DialogHeader>
    <DialogBody><div className="space-y-4">
      {saved ? <div className="space-y-3"><p className="text-sm text-[var(--success)]">{student?.name}: monthly fee updated to Rs. {Number(fee.amount).toLocaleString('en-IN')}.</p><Link className="text-sm font-semibold text-[var(--accent)] underline" href={`/collect?student_id=${student?.id}`}>Open fee collection</Link></div> : <>
        <StudentPicker value={search} className={fee.class_name ?? undefined} onChange={(value) => { setSearch(value); setStudent(null); setConfirmed(false); }} onSelect={(value) => { setStudent(value); setSearch(`${value.name} (${value.student_code})`); setConfirmed(false); }} />
        {student && <div className="border-y border-[var(--panel-line)] py-4 text-sm"><p className="font-semibold">{student.name}</p><p className="mt-2">Current monthly fee: {currentFee.isLoading ? 'Loading...' : currentFee.isError ? 'Unavailable' : `Rs. ${currentFee.data?.expected_fee_amount}`}</p><p className="mt-1 font-semibold">New monthly fee: Rs. {Number(fee.amount).toLocaleString('en-IN')}</p></div>}
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 h-4 w-4" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />Replace the monthly fee for this student. Outstanding dues will use the new amount; recorded payments remain unchanged.</label>
      </>}
    </div></DialogBody>
    <DialogFooter><Button variant="outline" disabled={apply.isPending} onClick={onClose}>{saved ? 'Done' : 'Cancel'}</Button>{!saved && <Button loading={apply.isPending} disabled={!student || !confirmed || !currentFee.data || currentFee.isError} onClick={() => apply.mutate()}>Apply monthly fee</Button>}</DialogFooter>
  </DialogContent></Dialog>;
}
