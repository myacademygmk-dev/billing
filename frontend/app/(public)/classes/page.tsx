import Link from 'next/link';
import { GlowOrb } from '@/components/ui/glow-orb';

const CLASSES_DATA = [
  {
    group: 'Middle School',
    description: 'Building strong fundamentals with focused attention',
    classes: [
      { standard: '6th Standard', board: 'State Board', subjects: ['Tamil', 'English', 'Mathematics', 'Science', 'Social Science'], color: 'bg-blue-50 text-blue-700 border-blue-200' },
      { standard: '7th Standard', board: 'State Board', subjects: ['Tamil', 'English', 'Mathematics', 'Science', 'Social Science'], color: 'bg-blue-50 text-blue-700 border-blue-200' },
      { standard: '8th Standard', board: 'State Board', subjects: ['Tamil', 'English', 'Mathematics', 'Science', 'Social Science'], color: 'bg-blue-50 text-blue-700 border-blue-200' },
    ],
  },
  {
    group: 'High School',
    description: 'Preparing students for board examinations',
    classes: [
      { standard: '9th Standard', board: 'State Board', subjects: ['Tamil', 'English', 'Mathematics', 'Science', 'Social Science'], color: 'bg-violet-50 text-violet-700 border-violet-200' },
      { standard: '10th Standard', board: 'State Board (SSLC)', subjects: ['Tamil', 'English', 'Mathematics', 'Science', 'Social Science'], color: 'bg-violet-50 text-violet-700 border-violet-200' },
    ],
  },
  {
    group: 'Higher Secondary',
    description: 'Specialized streams for college preparation',
    classes: [
      { standard: '11th Standard', board: 'State Board (HSC)', subjects: ['Tamil', 'English', 'Maths', 'Physics', 'Chemistry', 'Biology / Computer Science'], color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      { standard: '12th Standard', board: 'State Board (HSC)', subjects: ['Tamil', 'English', 'Maths', 'Physics', 'Chemistry', 'Biology / Computer Science'], color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    ],
  },
];

const FEATURES = [
  { icon: '👨‍🏫', title: 'Small Batch Size', desc: 'Maximum 25 students per batch for personalized attention' },
  { icon: '📝', title: 'Regular Testing', desc: 'Weekly tests and monthly assessments to track progress' },
  { icon: '📚', title: 'Study Materials', desc: 'Comprehensive notes and practice papers provided' },
  { icon: '🕐', title: 'Flexible Timings', desc: 'Morning and evening batches available' },
];

export default function ClassesPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] py-8 sm:py-10">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-indigo-200">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white font-medium">Classes</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Classes We Offer</h1>
          <p className="mt-3 text-lg text-indigo-100">Comprehensive coaching from 6th to 12th Standard</p>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Classes Grid */}
      <section className="relative overflow-hidden bg-slate-50 py-12 sm:py-14">
        <GlowOrb color="bg-violet-200/40" className="-left-20 -top-20 h-72 w-72" />
        <GlowOrb color="bg-indigo-200/30" className="-bottom-16 -right-16 h-64 w-64" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          {CLASSES_DATA.map((group) => (
            <div key={group.group} className="mb-10 last:mb-0">
              <h2 className="text-xl font-bold text-slate-900">{group.group}</h2>
              <p className="mt-1 text-sm text-slate-500">{group.description}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.classes.map((cls) => (
                  <div key={cls.standard} className="rounded-xl bg-white p-5 shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-slate-900">{cls.standard}</h3>
                      <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${cls.color}`}>
                        {cls.board}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1">
                      {cls.subjects.map((subject) => (
                        <div key={subject} className="flex items-center gap-2 text-sm text-slate-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                          {subject}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
          <p className="text-lg font-semibold text-slate-900">Ready to join?</p>
          <p className="mt-1 text-sm text-slate-500">Admissions are open for the current academic year.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/admissions"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700"
            >
              Apply Now
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
