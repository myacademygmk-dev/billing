import Link from 'next/link';
import { Card } from '@/components/ui/public-card';
import { GlowOrb } from '@/components/ui/glow-orb';
import { ManagementTeamSection } from './management-team';
import { TechnicalTeamSection } from './technical-team';

const MILESTONES = [
  { date: 'June 4, 2009', text: 'Established "MY ACADEMY" at Cemetery Road with', bold: '10 students and 2 teachers', dot: 'bg-indigo-600', badge: 'bg-slate-100 text-slate-600' },
  { date: '2010', text: 'After many obstacles, moved to Old Washermenpet with', bold: '40 students', dot: 'bg-violet-600', badge: 'bg-violet-50 text-violet-700' },
  { date: 'Present', text: 'Now proudly serving', bold: '200+ students with 22 teaching staff', dot: 'bg-emerald-600', badge: 'bg-emerald-50 text-emerald-700', live: true },
];

const LEGENDS = [
  { name: 'K. Kamarajar', quote: 'கல்வி என்பது பசுமை விரிந்த தோட்டம்', initials: 'KK', bg: 'bg-indigo-600' },
  { name: 'A.P.J. Abdul Kalam', quote: 'Equal opportunity to develop our talents', initials: 'AK', bg: 'bg-violet-600' },
  { name: 'Swami Vivekananda', quote: 'Education is the manifestation of perfection', initials: 'SV', bg: 'bg-teal-600' },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] py-8 sm:py-10">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-indigo-200">
            <span>Home</span>
            <span>/</span>
            <span className="text-white font-medium">About Us</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">About Us</h1>
          <p className="mt-3 text-lg text-indigo-100">Discipline + Smart Work + Happiness = MY Academy</p>
        </div>
      </section>

      {/* Our Story — compact timeline + motto, one section */}
      <section className="relative overflow-hidden bg-slate-50 py-12 sm:py-14">
        <GlowOrb color="bg-indigo-200/40" className="-left-24 -top-24 h-72 w-72" />
        <GlowOrb color="bg-violet-200/30" className="-bottom-20 -right-20 h-64 w-64" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="reveal text-2xl font-bold text-center">
            <span className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] bg-clip-text text-transparent">Our Story</span>
          </h2>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            {/* Timeline */}
            <div className="reveal-left relative">
              <div className="absolute left-[9px] top-1 bottom-1 w-px bg-slate-200" />
              {MILESTONES.map((m) => (
                <div key={m.date} className="relative pl-7 pb-6 last:pb-0">
                  <div className={`absolute left-0 top-1 flex h-[19px] w-[19px] items-center justify-center rounded-full ${m.dot} ring-4 ring-slate-50 ${m.live ? 'animate-pulse' : ''}`}>
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${m.badge}`}>
                    {m.date}
                  </span>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                    {m.text} <strong className="font-semibold text-slate-900">{m.bold}</strong>.
                  </p>
                </div>
              ))}
            </div>

            {/* Motto & quote */}
            <Card interactive={false} className="reveal-right relative overflow-hidden">
              <svg className="pointer-events-none absolute -right-3 -top-4 h-20 w-20 text-indigo-50" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.17 6A5.17 5.17 0 0 0 2 11.17V18h6.83v-6.83H5.5a1.67 1.67 0 0 1 1.67-1.67V6Zm10 0a5.17 5.17 0 0 0-5.17 5.17V18H18.8v-6.83h-3.33a1.67 1.67 0 0 1 1.67-1.67V6Z" />
              </svg>
              <div className="relative p-5">
                <p className="text-lg font-semibold text-slate-900">&ldquo;GAIN MORE KNOWLEDGE&rdquo;</p>
                <p className="mt-1 text-xs text-slate-500">மேலும் அறிவு பெற</p>
                <div className="mt-4 border-l-2 border-indigo-600 pl-3">
                  <p className="text-sm text-slate-600 leading-relaxed">In school, they teach a lesson and then give a test. In our institute, we give a test that teaches a lesson.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="relative overflow-hidden bg-white py-12 sm:py-14">
        <GlowOrb color="bg-amber-100/50" className="-right-16 top-1/2 h-56 w-56 -translate-y-1/2" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
          <p className="reveal text-xs font-semibold uppercase tracking-widest text-indigo-600">Leadership</p>
          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="reveal-left flex-shrink-0 mx-auto sm:mx-0">
              <div className="h-24 w-24 rounded-xl overflow-hidden shadow-sm transition-transform duration-300 hover:-rotate-2 hover:scale-105">
                <img src="/images/260x260_staff8.jpg" alt="Mr. V. Pradeep Kumar" className="h-full w-full object-cover" />
              </div>
            </div>
            <div className="reveal-right text-center sm:text-left">
              <h3 className="text-lg font-semibold text-slate-900">Mr. V. Pradeep Kumar</h3>
              <p className="mt-0.5 text-sm font-medium text-indigo-600">Founder & Managing Director</p>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                {['M.COM', 'M.B.A', 'Ph.D', '16+ Yrs'].map((q) => (
                  <span key={q} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700">{q}</span>
                ))}
              </div>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Started his journey in 2006 providing career guidelines. In 2009, with his dedication and potential, he established MY ACADEMY — motivating every faculty member to work toward student success ever since.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision & Inspiration */}
      <section className="relative overflow-hidden bg-slate-50 py-12 sm:py-14">
        <GlowOrb color="bg-teal-200/30" className="left-1/2 -top-24 h-72 w-72 -translate-x-1/2" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
          <p className="reveal text-xs font-semibold uppercase tracking-widest text-indigo-600 text-center">Purpose</p>
          <h2 className="reveal mt-1 text-2xl font-bold text-center">
            <span className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] bg-clip-text text-transparent">Mission & Vision</span>
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Card className="reveal-left">
              <div className="p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="mt-3 text-base font-semibold text-slate-900">Mission</h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">Providing comprehensive, individually focused learning that prepares students for academic and life success.</p>
              </div>
            </Card>
            <Card className="reveal-right">
              <div className="p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-600 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" /></svg>
                </div>
                <h3 className="mt-3 text-base font-semibold text-slate-900">Vision</h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">&ldquo;Improving lives through learning&rdquo; — nurturing young minds and shaping future leaders.</p>
              </div>
            </Card>
          </div>

          {/* Inspired by */}
          <p className="reveal mt-8 text-xs font-semibold uppercase tracking-widest text-indigo-600 text-center">Inspired By</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {LEGENDS.map((legend, i) => (
              <Card key={legend.name} className={`reveal reveal-delay-${i + 1}`}>
                <div className="flex items-center gap-3 p-4">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white transition-transform duration-300 group-hover:scale-110 ${legend.bg}`}>{legend.initials}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{legend.name}</p>
                    <p className="text-xs italic text-slate-500 truncate">&ldquo;{legend.quote}&rdquo;</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="reveal mt-8 text-center">
            <Link href="/facilities" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-800">
              See our campus facilities
              <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Management Team */}
      <ManagementTeamSection />

      {/* Technical Team */}
      <TechnicalTeamSection />

      {/* Quick Links */}
      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="reveal text-xs font-semibold uppercase tracking-widest text-indigo-600 text-center">Quick Links</p>
          <h2 className="reveal mt-1 text-2xl font-bold text-center">
            <span className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] bg-clip-text text-transparent">Explore More</span>
          </h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/faculty" className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-transform duration-300 group-hover:scale-110">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Faculty</p>
                <p className="text-xs text-slate-500">Meet our experienced teaching staff</p>
              </div>
              <svg className="ml-auto h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>

            <Link href="/facilities" className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600 transition-transform duration-300 group-hover:scale-110">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Facilities</p>
                <p className="text-xs text-slate-500">Our campus and learning infrastructure</p>
              </div>
              <svg className="ml-auto h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>

            <Link href="/achievements" className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition-transform duration-300 group-hover:scale-110">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .982-3.172M12 3.75a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Achievements</p>
                <p className="text-xs text-slate-500">Our students' academic excellence</p>
              </div>
              <svg className="ml-auto h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>

            <Link href="/contact" className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600 transition-transform duration-300 group-hover:scale-110">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Contact Us</p>
                <p className="text-xs text-slate-500">Get in touch with us</p>
              </div>
              <svg className="ml-auto h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
