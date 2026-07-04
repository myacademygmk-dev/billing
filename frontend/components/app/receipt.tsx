'use client';

import { Button } from '@/components/ui/button';

export type ReceiptData = {
  id: string;
  receipt_no: string;
  student_id: string;
  student_name?: string | null;
  student_code?: string | null;
  student_class?: string | null;
  amount: string;
  mode: string;
  paid_at: string;
  fee_period_label?: string | null;
  reference_no?: string | null;
  notes?: string | null;
  next_due_label?: string | null;
  pending_amount?: string | null;
  pending_label?: string | null;
};

function buildPrintHtml(data: ReceiptData): string {
  const date = new Date(data.paid_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = new Date(data.paid_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const details: string[] = [];
  if (data.fee_period_label) details.push(detailRow('Fee Period', data.fee_period_label));
  if (data.next_due_label) details.push(detailRow('Next Due', data.next_due_label));
  if (data.pending_label) {
    details.push(detailRow('Pending', data.pending_label, '#ea580c'));
  }
  if (data.notes) details.push(detailRow('Remarks', data.notes));

  return [
    '<!DOCTYPE html><html><head>',
    '<meta charset="utf-8">',
    `<title>Receipt - ${data.receipt_no}</title>`,
    '<style>',
    receiptStyles(),
    '</style></head><body>',
    '<div class="receipt">',
    // Header
    '<div class="header">',
    '  <div class="brand"><div class="logo">LOGO</div><div class="brand-text"><h1>MY ACADEMY</h1><p>Educational Institutions</p></div></div>',
    '  <div class="header-right"><div class="doc-type">RECEIPT</div><div class="regd">Regd.No - 469/2016</div></div>',
    '</div>',
    '<div class="divider"></div>',
    // Info grid
    '<div class="info-grid">',
    `  <div class="info-block"><label>Receipt No</label><div class="val">${data.receipt_no}</div></div>`,
    `  <div class="info-block right"><label>Date</label><div class="val">${date}</div><div class="val-sub">${time}</div></div>`,
    '</div>',
    // Student
    '<div class="student-section">',
    '  <div class="s-label">Student</div>',
    `  <div class="s-name">${data.student_name ?? 'Student'}</div>`,
    '  <div class="s-meta">',
    data.student_code ? `<span>Roll No: <strong>${data.student_code}</strong></span>` : '',
    data.student_class ? `<span>Class: <strong>${data.student_class}</strong></span>` : '',
    '  </div>',
    '</div>',
    // Payment
    '<div class="payment-box">',
    `  <div class="payment-header"><span>Amount Paid</span><span class="mode-badge">${data.mode.toUpperCase()}</span></div>`,
    `  <div class="payment-body"><span class="currency">\u20B9</span><span class="pay-amount">${data.amount}</span></div>`,
    '</div>',
    // Details
    details.length ? `<div class="details-section">${details.join('')}</div>` : '',
    // Footer
    '<div class="footer">',
    '  <div class="footer-note">Computer generated receipt.<br>No signature required.</div>',
    '  <div class="sig-block"><div class="sig-line"></div><div class="sig-text">Authorized Signatory</div></div>',
    '</div>',
    '</div>',
    '</body></html>',
  ].join('\n');
}

function detailRow(label: string, value: string, color?: string): string {
  const style = color ? ` style="color:${color};font-weight:700"` : '';
  return `<div class="detail-row"><span class="d-label">${label}</span><span class="d-value"${style}>${value}</span></div>`;
}

function receiptStyles(): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, sans-serif; background: #fff; color: #1f2937; }
    .receipt { max-width: 600px; margin: 0 auto; padding: 48px 40px; }

    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .logo { width: 48px; height: 48px; border-radius: 10px; background: #111827; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 8px; font-weight: 700; }
    .brand-text h1 { font-size: 20px; font-weight: 800; color: #111827; letter-spacing: -0.3px; }
    .brand-text p { font-size: 11px; color: #6b7280; font-weight: 500; margin-top: 1px; }
    .header-right { text-align: right; }
    .doc-type { font-size: 28px; font-weight: 800; color: #111827; letter-spacing: -0.5px; }
    .regd { font-size: 10px; color: #9ca3af; margin-top: 4px; }

    .divider { height: 3px; background: #111827; margin-bottom: 28px; }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .info-block label { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: 1.2px; color: #9ca3af; font-weight: 600; margin-bottom: 4px; }
    .info-block .val { font-size: 15px; font-weight: 700; color: #111827; }
    .info-block .val-sub { font-size: 12px; color: #6b7280; }
    .info-block.right { text-align: right; }

    .student-section { background: #f9fafb; border-radius: 10px; padding: 18px 22px; margin-bottom: 24px; border: 1px solid #f3f4f6; }
    .s-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1.2px; color: #9ca3af; font-weight: 600; margin-bottom: 6px; }
    .s-name { font-size: 17px; font-weight: 700; color: #111827; }
    .s-meta { display: flex; gap: 20px; margin-top: 5px; font-size: 12px; color: #4b5563; }

    .payment-box { border: 2px solid #111827; border-radius: 10px; overflow: hidden; margin-bottom: 24px; }
    .payment-header { background: #111827; padding: 10px 22px; display: flex; justify-content: space-between; align-items: center; }
    .payment-header span { font-size: 10px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 1px; }
    .mode-badge { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: #fff; font-size: 10px; font-weight: 700; padding: 3px 12px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .payment-body { padding: 24px 22px; display: flex; align-items: baseline; gap: 6px; }
    .currency { font-size: 20px; font-weight: 600; color: #6b7280; }
    .pay-amount { font-size: 40px; font-weight: 800; color: #111827; letter-spacing: -1px; }

    .details-section { margin-bottom: 28px; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid #f3f4f6; }
    .detail-row:last-child { border-bottom: none; }
    .d-label { font-size: 13px; color: #6b7280; font-weight: 500; }
    .d-value { font-size: 13px; font-weight: 600; color: #111827; }

    .footer { margin-top: 36px; padding-top: 18px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: flex-end; }
    .footer-note { font-size: 10px; color: #9ca3af; line-height: 1.8; }
    .sig-block { text-align: center; }
    .sig-line { width: 120px; height: 1px; background: #d1d5db; margin-bottom: 6px; }
    .sig-text { font-size: 9px; color: #9ca3af; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }

    @media print {
      .receipt { max-width: 100%; padding: 32px; }
      .divider, .payment-header, .logo { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;
}

function handleDownload(data: ReceiptData) {
  const html = buildPrintHtml(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.receipt_no}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handlePrint(data: ReceiptData) {
  const html = buildPrintHtml(data);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 250);
  };
}

export function Receipt({ data, onClose }: { data: ReceiptData; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--panel-line)] bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4 text-center">
          <h2 className="text-xl font-bold text-gray-900">MY ACADEMY</h2>
          <p className="mt-1 text-xs text-gray-500">Educational Institutions</p>
          <p className="mt-0.5 text-[10px] text-gray-400">Regd.No - 469/2016</p>
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
          <div className="mt-0.5 flex gap-4 text-sm text-gray-600">
            {data.student_code && <span>Roll No: {data.student_code}</span>}
            {data.student_class && <span>Class: {data.student_class}</span>}
          </div>
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
          {data.pending_label && (
            <div className="flex items-center justify-between border-b border-gray-100 py-2 text-sm">
              <span className="text-gray-500">Pending</span>
              <span className="font-medium text-orange-600">{data.pending_label}</span>
            </div>
          )}
          {data.notes && (
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-gray-500">Remarks</span>
              <span className="font-medium text-gray-800">{data.notes}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 border-t border-dashed border-gray-200 pt-3 text-center text-xs text-gray-400">
          This is a computer-generated receipt. Thank you for the payment.
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={() => handlePrint(data)}>Print Receipt</Button>
        <Button variant="outline" onClick={() => handleDownload(data)}>
          Download Receipt
        </Button>
        <Button variant="outline" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
