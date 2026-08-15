'use client';

import { useState } from 'react';
import { Card, CardBadge } from '@/components/ui/public-card';
import { GlowOrb } from '@/components/ui/glow-orb';

const AVATAR_COLORS = ['bg-indigo-600', 'bg-violet-600', 'bg-teal-600', 'bg-amber-600'];

type AlumniEntry = {
  name: string;
  batch: string;
  batchYear: number;
  company: string;
  role: string;
  location: string;
  initials: string;
};

const NOTABLE_ALUMNI: AlumniEntry[] = [
  { name: 'Priya Sharma', batch: 'Class of 2010', batchYear: 2010, company: 'Google', role: 'Senior Software Engineer', location: 'Bangalore', initials: 'PS' },
  { name: 'Rajesh Kumar', batch: 'Class of 2012', batchYear: 2012, company: 'AIIMS Delhi', role: 'Cardiologist', location: 'New Delhi', initials: 'RK' },
  { name: 'Anita Desai', batch: 'Class of 2008', batchYear: 2008, company: 'Government of Tamil Nadu', role: 'IAS Officer', location: 'Chennai', initials: 'AD' },
  { name: 'Mohammed Irfan', batch: 'Class of 2015', batchYear: 2015, company: 'LearnSpark (Own Startup)', role: 'Founder & CEO', location: 'Hyderabad', initials: 'MI' },
  { name: 'Kavitha Rajan', batch: 'Class of 2011', batchYear: 2011, company: 'NASA JPL', role: 'Research Scientist', location: 'California, USA', initials: 'KR' },
  { name: 'Suresh Babu', batch: 'Class of 2009', batchYear: 2009, company: 'Deloitte', role: 'Chartered Accountant & Partner', location: 'Mumbai', initials: 'SB' },
  { name: 'Deepa Venkatesh', batch: 'Class of 2013', batchYear: 2013, company: 'Apollo Hospitals', role: 'Pediatric Surgeon', location: 'Chennai', initials: 'DV' },
  { name: 'Arun Prakash', batch: 'Class of 2014', batchYear: 2014, company: 'Microsoft', role: 'Product Manager', location: 'Pune', initials: 'AP' },
];

// Group alumni by batch year (descending)
function groupByYear(alumni: AlumniEntry[]): Record<number, AlumniEntry[]> {
  const grouped: Record<number, AlumniEntry[]> = {};
  for (const a of alumni) {
    if (!grouped[a.batchYear]) grouped[a.batchYear] = [];
    grouped[a.batchYear].push(a);
  }
  return grouped;
}

export default function AlumniPage() {
  const [formData, setFormData] = useState({
    name: '',
    batch_year: '',
    current_company: '',
    role: '',
    phone: '',
    email: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/backend/public/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          role: 'alumni',
          rating: 5,
          message: `[Alumni Registration] Batch: ${formData.batch_year} | Company: ${formData.current_company} | Role: ${formData.role} | Phone: ${formData.phone} | Email: ${formData.email} | Message: ${formData.message}`,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || 'Failed to submit');
      }
      setSubmitted(true);
      setFormData({ name: '', batch_year: '', current_company: '', role: '', phone: '', email: '', message: '' });
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const grouped = groupByYear(NOTABLE_ALUMNI);
  const sortedYears = Object.keys(grouped).map(Number).sort((a, b) => b - a);

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] py-8 sm:py-10">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-indigo-200">
            <span>Home</span>
            <span>/</span>
            <span className="text-white font-medium">Alumni</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Our Alumni Network</h1>
          <p className="mt-3 text-lg text-indigo-100">
            Our alumni community is a vibrant network of leaders, innovators, and changemakers spread across the globe.
          </p>
        </div>
      </section>

      {/* Year-wise Alumni Listing */}
      <section className="relative overflow-hidden bg-[#f5f3ff] py-12 sm:py-14">
        <GlowOrb color="bg-violet-200/40" className="-right-20 -top-20 h-72 w-72" />
        <GlowOrb color="bg-teal-200/30" className="-bottom-16 -left-16 h-64 w-64" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="reveal text-center">
            <h2 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] bg-clip-text text-transparent">Alumni Directory</span>
            </h2>
            <p className="mt-3 text-gray-600">Our distinguished alumni grouped by batch year</p>
          </div>

          <div className="mt-10 space-y-10">
            {sortedYears.map((year) => (
              <div key={year}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-sm font-bold text-white shadow-md">
                    {`'${String(year).slice(2)}`}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Class of {year}</h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-indigo-200 to-transparent" />
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {grouped[year].map((alumni, i) => (
                    <Card key={alumni.name} className={`reveal reveal-delay-${(i % 6) + 1}`}>
                      <div className="p-6">
                        <div className="flex items-center gap-4">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                            {alumni.initials}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-base font-semibold text-slate-900 truncate">{alumni.name}</h4>
                            <CardBadge tone="neutral">{alumni.batch}</CardBadge>
                          </div>
                        </div>
                        <div className="mt-4 space-y-1 border-t border-slate-100 pt-4">
                          <p className="text-sm font-medium text-slate-800">{alumni.role}</p>
                          <p className="text-sm text-slate-500">{alumni.company}</p>
                        </div>
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                          </svg>
                          <span>{alumni.location}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Register as Alumni Form */}
      <section className="bg-white py-12 sm:py-16" id="register">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] bg-clip-text text-transparent">Register as Alumni</span>
            </h2>
            <p className="mt-3 text-gray-600">Stay connected, mentor current students, and be part of reunion events and networking opportunities.</p>
          </div>

          {submitted ? (
            <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-8 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-800">Registration Submitted!</h3>
              <p className="mt-2 text-sm text-green-600">Thank you for registering. We&apos;ll verify your details and add you to our alumni network soon.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700 underline"
              >
                Register another alumni
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Batch Year *</label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="e.g. 2010"
                    value={formData.batch_year}
                    onChange={(e) => setFormData({ ...formData, batch_year: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Current Company</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Where you work now"
                    value={formData.current_company}
                    onChange={(e) => setFormData({ ...formData, current_company: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Role / Designation</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Your current role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Message (Optional)</label>
                <textarea
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  rows={3}
                  placeholder="Share a memory or message for the school..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Register as Alumni'}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
