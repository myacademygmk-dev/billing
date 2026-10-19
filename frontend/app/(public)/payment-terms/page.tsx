import Link from 'next/link';
import { AlertCircle, CreditCard, FileCheck, Receipt } from 'lucide-react';

const TERMS = [
  { title: 'Payment Modes', text: 'Fees can be paid at the office through accepted cash, UPI, or bank transfer modes.', icon: CreditCard },
  { title: 'Receipt Confirmation', text: 'A receipt is generated for every recorded payment. Parents should verify the student name, period, and amount.', icon: Receipt },
  { title: 'Due Dates', text: 'Monthly or term fees should be paid within the due period communicated by the academy office.', icon: FileCheck },
  { title: 'Corrections', text: 'Payment corrections must be requested through the office with receipt details. Approved corrections are recorded in the billing system.', icon: AlertCircle },
];

export default function PaymentTermsPage() {
  return (
    <div>
      <section className="relative bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] py-8 sm:py-10">
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-indigo-200">
            <Link href="/" className="transition-colors hover:text-white">Home</Link>
            <span>/</span>
            <span className="font-medium text-white">Payment Terms</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Payment Terms</h1>
          <p className="mt-3 text-lg text-indigo-100">Fee payment, receipt, and correction guidelines for parents.</p>
        </div>
      </section>

      <section className="bg-slate-50 py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-5 md:grid-cols-2">
            {TERMS.map((term) => {
              const Icon = term.icon;
              return (
                <article key={term.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">{term.title}</h2>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{term.text}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Office Verification Required</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Online information is for parent reference. Final fee status, concessions, reversals, and arrears are confirmed only by the academy office records.
            </p>
            <Link href="/contact" className="mt-5 inline-flex rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
              Contact Office
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
