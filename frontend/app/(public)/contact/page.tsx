'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/public-card';
import { GlowOrb } from '@/components/ui/glow-orb';

const INFO_ACCENTS = [
  { chip: 'bg-indigo-50', icon: 'text-indigo-600' },
  { chip: 'bg-teal-50', icon: 'text-teal-600' },
  { chip: 'bg-amber-50', icon: 'text-amber-600' },
  { chip: 'bg-violet-50', icon: 'text-violet-600' },
];

interface Testimonial {
  id: number;
  name: string;
  role: string;
  message: string;
  rating: number;
}

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Testimonials state
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  // Feedback form state
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const res = await fetch('/api/backend/public/testimonials');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setTestimonials(data);
        }
      } catch {
        // silent
      }
    }
    fetchTestimonials();
  }, []);

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

  async function handleFeedback(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedbackLoading(true);
    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem('feedback_name') as HTMLInputElement).value,
      role: (form.elements.namedItem('feedback_role') as HTMLSelectElement).value,
      message: (form.elements.namedItem('feedback_message') as HTMLTextAreaElement).value,
      rating: feedbackRating,
    };
    try {
      const res = await fetch('/api/backend/public/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) setFeedbackSubmitted(true);
    } catch {}
    setFeedbackLoading(false);
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] py-8 sm:py-10">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-indigo-200">
            <span>Home</span>
            <span>/</span>
            <span className="text-white font-medium">Contact Us</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Contact Us</h1>
          <p className="mt-3 text-lg text-indigo-100">We&apos;d love to hear from you</p>
        </div>
      </section>

      {/* Content */}
      <section className="relative overflow-hidden bg-slate-50 py-12 sm:py-14">
        <GlowOrb color="bg-indigo-200/40" className="-left-20 -top-20 h-72 w-72" />
        <GlowOrb color="bg-teal-200/30" className="-bottom-16 -right-16 h-64 w-64" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
            {/* Form */}
            <div className="lg:col-span-3">
              <Card interactive={false}>
                <div className="p-8 sm:p-10">
                  <h3 className="text-xl font-semibold text-slate-900 sm:text-2xl">Admission Enquiry</h3>
                  <p className="mt-2 text-sm text-slate-500">Fill in your details and we&apos;ll get back to you</p>
                  {submitted ? (
                    <div className="mt-8 rounded-lg bg-emerald-50 border border-emerald-100 p-8 text-center">
                      <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-emerald-600 animate-[pulse_1.5s_ease-in-out_1]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </div>
                      <p className="mt-4 text-lg font-semibold text-slate-900">Enquiry Submitted!</p>
                      <p className="mt-2 text-sm text-slate-500">We will contact you soon.</p>
                    </div>
                  ) : (
                    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <input name="student_name" type="text" placeholder="Student Name *" required className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition" />
                        <input name="parent_name" type="text" placeholder="Parent Name" className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition" />
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <input name="phone" type="tel" placeholder="Phone Number *" required className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition" />
                        <select name="standard" className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition">
                          <option value="">Select Standard</option>
                          <option>LKG - UKG</option>
                          <option>1st - 5th</option>
                          <option>6th - 8th</option>
                          <option>9th - 10th</option>
                          <option>11th - 12th</option>
                        </select>
                      </div>
                      <select name="board" className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition">
                        <option value="">Select Board</option>
                        <option>SAMACHEER</option>
                        <option>State Board</option>
                        <option>CBSE</option>
                      </select>
                      <textarea name="message" placeholder="Message (optional)" rows={4} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition resize-none" />
                      <button type="submit" disabled={loading} className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.99] disabled:opacity-50">
                        {loading ? 'Submitting...' : 'Submit Enquiry'}
                      </button>
                    </form>
                  )}
                </div>
              </Card>
            </div>

            {/* Info Cards */}
            <div className="space-y-4 lg:col-span-2">
              {[
                { label: 'Address', value: '20/4, Kalingarayan Street, 1st Lane,\nOld Washermenpet, Chennai-21.', icon: 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z' },
                { label: 'Phone', value: '044-4356 8296', icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z' },
                { label: 'Email', value: 'myacademy2009@gmail.com', icon: 'M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75' },
                { label: 'Hours', value: 'Mon - Sat: 9:00 AM - 8:00 PM', icon: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
              ].map((item, i) => {
                const accent = INFO_ACCENTS[i % INFO_ACCENTS.length];
                return (
                  <Card key={item.label}>
                    <div className="flex items-start gap-4 p-6">
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${accent.chip}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${accent.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{item.label}</p>
                        <p className="mt-1.5 text-sm text-slate-700 whitespace-pre-line">{item.value}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Map Placeholder */}
          <Card interactive={false} className="mt-8">
            <div className="p-4">
              <div className="rounded-lg bg-slate-100 h-64 flex items-center justify-center">
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                  </svg>
                  <p className="mt-3 text-sm font-medium text-slate-400">Map • Old Washermenpet, Chennai-21</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section className="relative overflow-hidden bg-white py-12 sm:py-14">
          <GlowOrb color="bg-violet-200/30" className="-right-20 -top-16 h-64 w-64" />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 text-center">What People Say</p>
            <h2 className="mt-1 text-2xl font-bold text-center">
              <span className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] bg-clip-text text-transparent">Testimonials</span>
            </h2>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t) => (
                <Card key={t.id}>
                  <div className="p-5">
                    {/* Star Rating */}
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 ${star <= t.rating ? 'text-amber-400' : 'text-slate-200'}`}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>

                    {/* Message */}
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed line-clamp-4">&ldquo;{t.message}&rdquo;</p>

                    {/* Author */}
                    <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
                        {t.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                        <span className="inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">{t.role}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Share Your Feedback */}
      <section className="relative overflow-hidden bg-slate-50 py-12 sm:py-14">
        <GlowOrb color="bg-amber-200/30" className="-left-16 -bottom-16 h-64 w-64" />
        <div className="relative mx-auto max-w-2xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 text-center">Your Voice Matters</p>
          <h2 className="mt-1 text-2xl font-bold text-center">
            <span className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] bg-clip-text text-transparent">Share Your Feedback</span>
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">Help us improve by sharing your experience</p>

          <Card interactive={false} className="mt-8">
            <div className="p-8">
              {feedbackSubmitted ? (
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-8 text-center">
                  <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-emerald-600 animate-[pulse_1.5s_ease-in-out_1]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                  <p className="mt-4 text-lg font-semibold text-slate-900">Thank You!</p>
                  <p className="mt-2 text-sm text-slate-500">Your feedback has been submitted successfully.</p>
                </div>
              ) : (
                <form className="space-y-5" onSubmit={handleFeedback}>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <input
                      name="feedback_name"
                      type="text"
                      placeholder="Your Name *"
                      required
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition"
                    />
                    <select
                      name="feedback_role"
                      required
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition"
                    >
                      <option value="">Select Role *</option>
                      <option value="Parent">Parent</option>
                      <option value="Student">Student</option>
                      <option value="Alumni">Alumni</option>
                    </select>
                  </div>

                  {/* Star Rating Input */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Rating *</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className="p-1 transition-transform hover:scale-110"
                          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-7 w-7 transition-colors ${star <= feedbackRating ? 'text-amber-400' : 'text-slate-200 hover:text-amber-200'}`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    name="feedback_message"
                    placeholder="Share your experience... *"
                    required
                    rows={4}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition resize-none"
                  />

                  <button
                    type="submit"
                    disabled={feedbackLoading}
                    className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.99] disabled:opacity-50"
                  >
                    {feedbackLoading ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </form>
              )}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
