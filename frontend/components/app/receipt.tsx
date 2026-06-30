'use client';

import { Button } from '@/components/ui/button';

export type ReceiptData = {
  id: string;
  receipt_no: string;
  student_id: string;
  student_name?: string | null;
  student_code?: string | null;
  amount: string;
  mode: string;
  paid_at: string;
  fee_period_label?: string | null;
  reference_no?: string | null;
  notes?: string | null;
  next_due_label?: string | null;
  pending_amount?: string | null;
};

export function Receipt({ data, onClose }: { data: ReceiptData; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--panel-line)] bg-white p-6 shadow-sm print:border print:shadow-none">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4 text-center">
          <h2 className="text-xl font-bold text-gray-900">MYACADEMY</h2>
          <p className="mt-1 text-xs text-gray-500">Fee Collection Receipt</p>
        </div>

        {/* Receipt No & Date */}
        <div className="mt-4 flex items-center justify-between border-b border-dashed border-gray-200 pb-3">
          <div>
            <div className="text-xs font-medium uppercase text-gray-500">Receipt No</div>
            <div className="mt-0.5 text-lg font-bold text-gray-900">{data.receipt_no}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-medium uppercase text-gray-500">Date</div>
            <div className="mt-0.5 text-sm font-semibold text-gray-800">
              {new Date(data.paid_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(data.paid_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Student Info */}
        <div className="mt-4 rounded-lg bg-gray-50 p-3">
          <div className="text-xs font-medium uppercase text-gray-500">Student</div>
          <div className="mt-1 text-base font-semibold text-gray-900">
            {data.student_name ?? 'Student'}
          </div>
          {data.student_code && (
            <div className="mt-0.5 text-sm text-gray-600">Roll No: {data.student_code}</div>
          )}
        </div>

        {/* Amount */}
        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4 text-center">
          <div className="text-xs font-medium uppercase text-blue-600">Amount Paid</div>
          <div className="mt-1 text-2xl font-bold text-blue-700">₹{data.amount}</div>
          <div className="mt-1 text-xs font-medium text-blue-500 capitalize">{data.mode}</div>
        </div>

        {/* Details */}
        <div className="mt-4 space-y-2">
          {data.fee_period_label && (
            <div className="flex items-center justify-between border-b border-gray-100 py-2 text-sm">
              <span className="text-gray-500">Fee Period</span>
              <span className="font-medium text-gray-800">{data.fee_period_label}</span>
            </div>
          )}
          {data.next_due_label && (
            <div className="flex items-center justify-between border-b border-gray-100 py-2 text-sm">
              <span className="text-gray-500">Next Due</span>
              <span className="font-medium text-gray-800">{data.next_due_label}</span>
            </div>
          )}
          {data.pending_amount && Number(data.pending_amount) > 0 && (
            <div className="flex items-center justify-between border-b border-gray-100 py-2 text-sm">
              <span className="text-gray-500">Pending Balance</span>
              <span className="font-medium text-orange-600">₹{data.pending_amount}</span>
            </div>
          )}
          {(data.reference_no || data.notes) && (
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-gray-500">Remarks</span>
              <span className="font-medium text-gray-800">{data.reference_no || data.notes}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 border-t border-dashed border-gray-200 pt-3 text-center text-xs text-gray-400">
          This is a computer-generated receipt. Thank you for the payment.
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 print:hidden">
        <Button onClick={() => window.print()}>Print Receipt</Button>
        <Button variant="outline" onClick={() => window.location.assign(`/api/backend/payments/${data.id}/receipt.pdf`)}>
          Download PDF
        </Button>
        <Button variant="outline" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
