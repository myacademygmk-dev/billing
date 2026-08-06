'use client';

import Link from 'next/link';
import { Card, CardBadge } from '@/components/ui/public-card';
import { GlowOrb } from '@/components/ui/glow-orb';

const AVATAR_COLORS = ['bg-indigo-600', 'bg-violet-600', 'bg-teal-600', 'bg-amber-600'];

const NOTABLE_ALUMNI = [
  {
    name: 'Priya Sharma',
    batch: 'Class of 2010',
    company: 'Google',
    role: 'Senior Software Engineer',
    location: 'Bangalore',
    initials: 'PS',
  },
  {
    name: 'Rajesh Kumar',
    batch: 'Class of 2012',
    company: 'AIIMS Delhi',
    role: 'Cardiologist',
    location: 'New Delhi',
    initials: 'RK',
  },
  {
    name: 'Anita Desai',
    batch: 'Class of 2008',
    company: 'Government of Tamil Nadu',
    role: 'IAS Officer',
    location: 'Chennai',
    initials: 'AD',
  },
  {
    name: 'Mohammed Irfan',
    batch: 'Class of 2015',
    company: 'LearnSpark (Own Startup)',
    role: 'Founder & CEO',
    location: 'Hyderabad',
    initials: 'MI',
  },
  {
    name: 'Kavitha Rajan',
    batch: 'Class of 2011',
    company: 'NASA JPL',
    role: 'Research Scientist',
    location: 'California, USA',
    initials: 'KR',
  },
  {
    name: 'Suresh Babu',
    batch: 'Class of 2009',
    company: 'Deloitte',
    role: 'Chartered Accountant & Partner',
    location: 'Mumbai',
    initials: 'SB',
  },
  {
    name: 'Deepa Venkatesh',
    batch: 'Class of 2013',
    company: 'Apollo Hospitals',
    role: 'Pediatric Surgeon',
    location: 'Chennai',
    initials: 'DV',
  },
  {
    name: 'Arun Prakash',
    batch: 'Class of 2014',
    company: 'Microsoft',
    role: 'Product Manager',
    location: 'Pune',
    initials: 'AP',
  },
];

export default function AlumniPage() {
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
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Our Alumni</h1>
          <p className="mt-3 text-lg text-indigo-100">
            Our alumni community is a vibrant network of leaders, innovators, and changemakers spread across the globe.
          </p>
        </div>
      </section>

      {/* Notable Alumni */}
      <section className="relative overflow-hidden bg-[#f5f3ff] py-12 sm:py-14">
        <GlowOrb color="bg-violet-200/40" className="-right-20 -top-20 h-72 w-72" />
        <GlowOrb color="bg-teal-200/30" className="-bottom-16 -left-16 h-64 w-64" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="reveal text-center">
            <h2 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] bg-clip-text text-transparent">Notable Alumni</span>
            </h2>
            <p className="mt-3 text-gray-600">Meet some of our distinguished alumni making an impact worldwide</p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {NOTABLE_ALUMNI.map((alumni, i) => (
              <Card key={alumni.name} className={`reveal reveal-delay-${(i % 6) + 1}`}>
                <div className="p-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                      {alumni.initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-slate-900 truncate">{alumni.name}</h3>
                      <CardBadge tone="neutral">{alumni.batch}</CardBadge>
                    </div>
                  </div>

                  {/* Role & Company */}
                  <div className="mt-4 space-y-1 border-t border-slate-100 pt-4">
                    <p className="text-sm font-medium text-slate-800">{alumni.role}</p>
                    <p className="text-sm text-slate-500">{alumni.company}</p>
                  </div>

                  {/* Location */}
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
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#eab308] to-[#fbbf24] py-12">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-[#0f172a]">Stay Connected</h2>
          <p className="mx-auto mt-3 max-w-xl text-[#0f172a]/70">
            Are you an alumnus of our institution? Register with us to stay connected, mentor current students, and be part of reunion events and networking opportunities.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-block rounded-xl bg-[#0f172a] px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            Register as Alumni
          </Link>
        </div>
      </section>
    </main>
  );
}
