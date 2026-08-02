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
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] py-16 sm:py-20">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-indigo-200">
            <span>Home</span>
            <span>/</span>
            <span className="text-white font-medium">Contact Us</span>
          </div>
          <h1 className="mt-4 text-4xl font-bold text-white sm:text-5xl">Contact Us</h1>
          <p className="mt-3 text-lg text-indigo-100">We&apos;d love to hear from you</p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-[#f5f3ff] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
            {/* Form */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl bg-white p-8 shadow-md border border-indigo-100 sm:p-10">
                <h3 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  <span className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] bg-clip-text text-transparent">Admission Enquiry</span>
                </h3>
                <p className="mt-2 text-sm text-gray-500">Fill in your details and we&apos;ll get back to you</p>
                {submitted ? (
                  <div className="mt-8 rounded-xl bg-[#f0fdf4] border border-[#0d9488]/20 p-8 text-center">
                    <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-[#0d9488]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                    <p className="mt-4 text-lg font-bold text-gray-900">Enquiry Submitted!</p>
                    <p className="mt-2 text-sm text-gray-600">We will contact you soon.</p>
                  </div>
                ) : (
                  <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <input name="student_name" type="text" placeholder="Student Name *" required className="w-full rounded-xl border border-gray-200 bg-[#f5f3ff] px-4 py-3 text-sm focus:border-[#4f46e5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 transition" />
                      <input name="parent_name" type="text" placeholder="Parent Name" className="w-full rounded-xl border border-gray-200 bg-[#f5f3ff] px-4 py-3 text-sm focus:border-[#4f46e5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 transition" />
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <input name="phone" type="tel" placeholder="Phone Number *" required className="w-full rounded-xl border border-gray-200 bg-[#f5f3ff] px-4 py-3 text-sm focus:border-[#4f46e5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 transition" />
                      <select name="standard" className="w-full rounded-xl border border-gray-200 bg-[#f5f3ff] px-4 py-3 text-sm text-gray-500 focus:border-[#4f46e5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 transition">
                        <option value="">Select Standard</option>
                        <option>LKG - UKG</option>
                        <option>1st - 5th</option>
                        <option>6th - 8th</option>
                        <option>9th - 10th</option>
                        <option>11th - 12th</option>
                      </select>
                    </div>
                    <select name="board" className="w-full rounded-xl border border-gray-200 bg-[#f5f3ff] px-4 py-3 text-sm text-gray-500 focus:border-[#4f46e5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 transition">
                      <option value="">Select Board</option>
                      <option>SAMACHEER</option>
                      <option>State Board</option>
                      <option>CBSE</option>
                    </select>
                    <textarea name="message" placeholder="Message (optional)" rows={4} className="w-full rounded-xl border border-gray-200 bg-[#f5f3ff] px-4 py-3 text-sm focus:border-[#4f46e5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 transition resize-none" />
                    <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-50">
                      {loading ? 'Submitting...' : 'Submit Enquiry'}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Info Cards */}
            <div className="space-y-4 lg:col-span-2">
              {[
                { label: 'Address', value: '20/4, Kalingarayan Street, 1st Lane,\nOld Washermenpet, Chennai-21.', icon: 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z' },
                { label: 'Phone', value: '044-4356 8296', icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z' },
                { label: 'Email', value: 'myacademy2009@gmail.com', icon: 'M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75' },
                { label: 'Hours', value: 'Mon - Sat: 9:00 AM - 8:00 PM', icon: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white p-6 shadow-md border border-indigo-100 transition-all duration-200 hover:shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#0d9488]/10">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#0d9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#4f46e5]">{item.label}</p>
                      <p className="mt-1.5 text-sm text-gray-700 whitespace-pre-line">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="mt-12 rounded-2xl bg-white p-4 shadow-md border border-indigo-100">
            <div className="rounded-xl bg-gradient-to-br from-[#f5f3ff] to-[#eef2ff] h-64 flex items-center justify-center">
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-[#4f46e5]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                </svg>
                <p className="mt-3 text-sm font-medium text-[#4f46e5]/60">Map • Old Washermenpet, Chennai-21</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
