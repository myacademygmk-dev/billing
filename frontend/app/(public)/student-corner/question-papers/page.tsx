import Link from 'next/link';
import { GlowOrb } from '@/components/ui/glow-orb';

const CLASSES = [
  { standard: '6th', subjects: ['Tamil', 'English', 'Maths', 'Science', 'Social Science'] },
  { standard: '7th', subjects: ['Tamil', 'English', 'Maths', 'Science', 'Social Science'] },
  { standard: '8th', subjects: ['Tamil', 'English', 'Maths', 'Science', 'Social Science'] },
  { standard: '9th', subjects: ['Tamil', 'English', 'Maths', 'Science', 'Social Science'] },
  { standard: '10th', subjects: ['Tamil', 'English', 'Maths', 'Science', 'Social Science'] },
  { standard: '11th', subjects: ['Tamil', 'English', 'Maths', 'Physics', 'Chemistry', 'Biology', 'Computer Science'] },
  { standard: '12th', subjects: ['Tamil', 'English', 'Maths', 'Physics', 'Chemistry', 'Biology', 'Computer Science'] },
];

export default function QuestionPapersPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] py-8 sm:py-10">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-indigo-200">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/student-corner" className="hover:text-white transition-colors">Student Corner</Link>
            <span>/</span>
            <span className="text-white font-medium">Question Papers</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Question Papers</h1>
          <p className="mt-3 text-lg text-indigo-100">Download previous year question papers for practice</p>
        </div>
      </section>

      {/* Content */}
      <section className="relative overflow-hidden bg-slate-50 py-12 sm:py-14">
        <GlowOrb color="bg-violet-200/40" className="-left-20 -top-20 h-72 w-72" />
        <GlowOrb color="bg-indigo-200/30" className="-bottom-16 -right-16 h-64 w-64" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CLASSES.map((cls) => (
              <div key={cls.standard} className="rounded-xl bg-white p-5 shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm">
                    {cls.standard}
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">{cls.standard} Standard</h3>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {cls.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-400 italic">Papers will be available for download soon.</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl bg-white p-6 text-center shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500">
              Question papers are being uploaded. Please check back soon or contact your class teacher for materials.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
