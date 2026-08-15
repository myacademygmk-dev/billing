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
    '  <div class="brand"><img src="' + (typeof window !== 'undefined' ? window.location.origin : '') + '/images/logo.jpeg" class="logo-img" alt="Logo" /><div class="brand-text"><h1>MY ACADEMY</h1><p>Gain More Knowledge</p></div></div>',
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
    .receipt { max-width: 420px; margin: 0 auto; padding: 32px 28px; }

    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .logo-img { width: 44px; height: 44px; border-radius: 10px; object-fit: contain; }
    .brand-text h1 { font-size: 18px; font-weight: 800; color: #111827; letter-spacing: -0.3px; }
    .brand-text p { font-size: 11px; color: #6b7280; font-weight: 500; margin-top: 1px; }
    .header-right { text-align: right; }
    .doc-type { font-size: 22px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px; }
    .regd { font-size: 10px; color: #9ca3af; margin-top: 4px; }

    .divider { height: 2px; background: linear-gradient(to right, #2563eb, #7c3aed); margin-bottom: 24px; }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .info-block label { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: 1.2px; color: #9ca3af; font-weight: 600; margin-bottom: 4px; }
    .info-block .val { font-size: 15px; font-weight: 700; color: #111827; }
    .info-block .val-sub { font-size: 12px; color: #6b7280; }
    .info-block.right { text-align: right; }

    .student-section { background: #f9fafb; border-radius: 10px; padding: 18px 22px; margin-bottom: 24px; border: 1px solid #f3f4f6; }
    .s-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1.2px; color: #9ca3af; font-weight: 600; margin-bottom: 6px; }
    .s-name { font-size: 17px; font-weight: 700; color: #111827; }
    .s-meta { display: flex; gap: 20px; margin-top: 5px; font-size: 12px; color: #4b5563; }

    .payment-box { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; margin-bottom: 24px; }
    .payment-header { background: #2563eb; padding: 8px 18px; display: flex; justify-content: space-between; align-items: center; }
    .payment-header span { font-size: 10px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 1px; }
    .mode-badge { background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: #fff; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .payment-body { padding: 14px 18px; display: flex; align-items: baseline; gap: 4px; }
    .currency { font-size: 16px; font-weight: 600; color: #6b7280; }
    .pay-amount { font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.5px; }

    .details-section { margin-bottom: 28px; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid #f3f4f6; }
    .detail-row:last-child { border-bottom: none; }
    .d-label { font-size: 13px; color: #6b7280; font-weight: 500; }
    .d-value { font-size: 13px; font-weight: 600; color: #111827; }

    .footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid #e5e7eb; }
    .footer-note { font-size: 10px; color: #9ca3af; line-height: 1.8; }

    @media print {
      @page { size: A5; margin: 10mm; }
      .receipt { max-width: 100%; padding: 20px; }
      .divider, .payment-header, .logo-img { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
  async function handleWhatsApp(d: ReceiptData) {
    try {
      const res = await fetch('/api/backend/utils/whatsapp/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ payment_id: d.id }),
      });
      const result = await res.json();
      if (result.status === 'sent') {
        alert('Receipt sent via WhatsApp ✅');
      } else if (result.status === 'skipped') {
        alert('WhatsApp API not configured. Add WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN to .env');
      } else {
        alert(`Failed: ${result.message || result.error || 'Unknown error'}`);
      }
    } catch (e) {
      alert('Failed to send WhatsApp message');
    }
  }
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--panel-line)] bg-white p-4 shadow-sm text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2">
            <img src="/images/logo.jpeg" alt="Logo" className="h-7 w-7 object-contain" />
            <div>
              <h2 className="text-sm font-bold text-gray-900">MY ACADEMY</h2>
              <p className="text-[9px] text-gray-400">Gain More Knowledge</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-gray-400">Regd.No - 469/2016</div>
          </div>
        </div>

        {/* Receipt No & Date */}
        <div className="mt-2 flex items-center justify-between">
          <div>
            <span className="text-gray-500">Receipt: </span>
            <span className="font-semibold text-gray-900">{data.receipt_no}</span>
          </div>
          <div className="text-gray-500">
            {new Date(data.paid_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>

        {/* Student */}
        <div className="mt-2 rounded bg-gray-50 px-2 py-1.5">
          <span className="font-medium text-gray-900">{data.student_name ?? 'Student'}</span>
          <span className="ml-2 text-gray-500">
            {data.student_code && `#${data.student_code}`}
            {data.student_class && ` • ${data.student_class}`}
          </span>
        </div>

        {/* Amount */}
        <div className="mt-2 flex items-center justify-between rounded bg-blue-50 px-3 py-2">
          <span className="text-blue-600 font-medium">Amount Paid</span>
          <span className="text-sm font-bold text-blue-700">₹{data.amount} <span className="text-[10px] font-normal text-blue-500 capitalize">({data.mode})</span></span>
        </div>

        {/* Details */}
        <div className="mt-2 space-y-1">
          {data.fee_period_label && (
            <div className="flex justify-between py-0.5">
              <span className="text-gray-500">Period</span>
              <span className="font-medium text-gray-800">{data.fee_period_label}</span>
            </div>
          )}
          {data.next_due_label && (
            <div className="flex justify-between py-0.5">
              <span className="text-gray-500">Next Due</span>
              <span className="font-medium text-gray-800">{data.next_due_label}</span>
            </div>
          )}
          {data.pending_label && (
            <div className="flex justify-between py-0.5">
              <span className="text-gray-500">Pending</span>
              <span className="font-medium text-orange-600">{data.pending_label}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-2 pt-2 border-t border-dashed border-gray-200 text-center text-[9px] text-gray-400">
          Computer-generated receipt. Thank you!
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-3">
        <Button size="sm" onClick={() => handlePrint(data)}>Print</Button>
        <Button size="sm" variant="outline" onClick={() => handleDownload(data)}>Download</Button>
        <Button size="sm" variant="outline" className="text-green-700 border-green-200 hover:bg-green-50" onClick={() => handleWhatsApp(data)}>
          WhatsApp
        </Button>
        <Button size="sm" variant="outline" onClick={onClose}>Done</Button>
      </div>
    </div>
  );
}
