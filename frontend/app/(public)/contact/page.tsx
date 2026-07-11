'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const data = {
      student_name: (form.elements.namedItem('student_name') as HTMLInputElement).value,
      parent_name: (form.elements.namedItem('parent_name') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      standard: (form.elements.namedItem('standard') as HTMLSelectElement).value,
      board: (form.elements.namedItem('board') as HTMLSelectElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
      source: 'website',
    };
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
      const res = await fetch(`${base}/public/enquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) setSubmitted(true);
    } catch {}
    setLoading(false);
  }
  return (
    <div>
      <section className="bg-gray-900 py-14 text-white sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-green-400">Get In Touch</div>
          <h1 className="mt-3 text-3xl font-bold sm:text-5xl">Contact Us</h1>
          <p className="mt-3 text-sm text-gray-400 sm:text-base">We&apos;d love to hear from you</p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
            {/* Info */}
            <div className="space-y-3 lg:col-span-2 sm:space-y-4">
              {[
                { label: 'Address', value: '20/4, Kalingarayan Street, 1st Lane,\nOld Washermenpet, Chennai-21.', icon: '📍' },
                { label: 'Phone', value: '044-4356 8296', icon: '📞' },
                { label: 'Email', value: 'myacademy2009@gmail.com', icon: '✉️' },
                { label: 'Hours', value: 'Mon - Sat: 9:00 AM - 8:00 PM', icon: '🕐' },
              ].map((item, i) => (
                <div key={item.label} className={`reveal reveal-delay-${i + 1} rounded-2xl bg-white border border-gray-100 p-4 shadow-sm transition-all duration-200 hover:shadow-md sm:p-6`}>
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 sm:text-[11px]">{item.label}</div>
                      <p className="mt-1.5 text-xs text-gray-700 whitespace-pre-line sm:text-sm">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="reveal lg:col-span-3">
              <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm sm:p-8">
                <h3 className="text-base font-bold text-gray-900 sm:text-lg">Admission Enquiry</h3>
                <p className="mt-1 text-xs text-gray-500 sm:text-sm">Fill in your details and we&apos;ll get back to you</p>
                {submitted ? (
                  <div className="mt-6 rounded-xl bg-green-50 border border-green-200 p-6 text-center">
                    <div className="text-3xl">✅</div>
                    <p className="mt-2 text-sm font-semibold text-green-800">Enquiry Submitted!</p>
                    <p className="mt-1 text-xs text-green-600">We will contact you soon.</p>
                  </div>
                ) : (
                <form className="mt-5 space-y-3 sm:mt-6 sm:space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                    <input name="student_name" type="text" placeholder="Student Name *" required className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm focus:border-blue-400 focus:bg-white focus:outline-none transition sm:px-4 sm:py-3" />
                    <input name="parent_name" type="text" placeholder="Parent Name" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm focus:border-blue-400 focus:bg-white focus:outline-none transition sm:px-4 sm:py-3" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                    <input name="phone" type="tel" placeholder="Phone Number *" required className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm focus:border-blue-400 focus:bg-white focus:outline-none transition sm:px-4 sm:py-3" />
                    <select name="standard" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500 focus:border-blue-400 focus:bg-white focus:outline-none transition sm:px-4 sm:py-3">
                      <option value="">Select Standard</option>
                      <option>LKG - UKG</option>
                      <option>1st - 5th</option>
                      <option>6th - 8th</option>
                      <option>9th - 10th</option>
                      <option>11th - 12th</option>
                    </select>
                  </div>
                  <select name="board" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500 focus:border-blue-400 focus:bg-white focus:outline-none transition sm:px-4 sm:py-3">
                    <option value="">Select Board</option>
                    <option>SAMACHEER</option>
                    <option>State Board</option>
                    <option>CBSE</option>
                  </select>
                  <textarea name="message" placeholder="Message (optional)" rows={3} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm focus:border-blue-400 focus:bg-white focus:outline-none transition resize-none sm:px-4 sm:py-3" />
                  <button type="submit" disabled={loading} className="w-full rounded-xl bg-gray-900 py-3 text-sm font-bold text-white transition-all duration-300 hover:bg-gray-800 disabled:opacity-50 sm:py-3.5">
                    {loading ? 'Submitting...' : 'Submit Enquiry'}
                  </button>
                </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
