import Link from 'next/link';
import { GlowOrb } from '@/components/ui/glow-orb';

const STEPS = [
  { step: '01', title: 'Enquiry', desc: 'Visit the academy or call us to learn about our programs and fee structure.' },
  { step: '02', title: 'Application', desc: 'Fill out the admission form available at our office or download it from here.' },
  { step: '03', title: 'Assessment', desc: 'A brief assessment to understand the student\'s current academic level.' },
  { step: '04', title: 'Enrollment', desc: 'Complete the enrollment with required documents and fee payment.' },
];

const REQUIREMENTS = [
  'Recent passport-size photographs (2 nos)',
  'Previous academic year mark sheet / report card',
  'Transfer Certificate (if applicable)',
  'Aadhaar card copy of the student',
  'Parent/Guardian Aadhaar card copy',
  'Community Certificate copy',
];

const FAQS = [
  { q: 'What classes do you offer?', a: 'We provide coaching for students from 6th to 12th Standard (State Board).' },
  { q: 'What are the timings?', a: 'We have morning batches (6:00 AM - 8:00 AM) and evening batches (4:30 PM - 7:30 PM). Timings may vary by class.' },
  { q: 'Is there a trial period?', a: 'Yes, students can attend classes for one week before confirming their enrollment.' },
  { q: 'What is the fee structure?', a: 'Fees vary by class. Please visit our office or contact us for detailed fee information.' },
];

export default function AdmissionsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] py-8 sm:py-10">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-indigo-200">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white font-medium">Admissions</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Admissions</h1>
          <p className="mt-3 text-lg text-indigo-100">Join MY Academy — where every student is guided to success</p>
        </div>
      </section>

      {/* Admission Process */}
      <section className="relative overflow-hidden bg-white py-12 sm:py-14">
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-center">
            <span className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] bg-clip-text text-transparent">Admission Process</span>
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">Simple 4-step process to get started</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.step} className="relative rounded-xl border border-slate-200 bg-slate-50 p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <span className="text-3xl font-black text-indigo-100">{s.step}</span>
                <h3 className="mt-2 text-base font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements + Contact */}
      <section className="relative overflow-hidden bg-slate-50 py-12 sm:py-14">
        <GlowOrb color="bg-violet-200/40" className="-left-20 -top-20 h-72 w-72" />
        <GlowOrb color="bg-indigo-200/30" className="-bottom-16 -right-16 h-64 w-64" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Requirements */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Documents Required</h3>
              <p className="mt-1 text-sm text-slate-500">Please bring the following at the time of enrollment:</p>
              <ul className="mt-4 space-y-2.5">
                {REQUIREMENTS.map((req) => (
                  <li key={req} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact for Admission */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Contact for Admission</h3>
              <p className="mt-1 text-sm text-slate-500">Reach out to us for any queries regarding admissions.</p>
              
              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Phone</p>
                    <p className="text-sm text-slate-600">+91 98765 43210</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Office Hours</p>
                    <p className="text-sm text-slate-600">Mon - Sat: 9:00 AM - 6:00 PM</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Visit Us</p>
                    <p className="text-sm text-slate-600">Old Washermenpet, Chennai</p>
                  </div>
                </div>
              </div>

              <Link
                href="/contact"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700"
              >
                Get in Touch
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-xl font-bold text-slate-900 text-center">Frequently Asked Questions</h2>
          <div className="mt-6 space-y-3">
            {FAQS.map((faq) => (
              <div key={faq.q} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{faq.q}</p>
                <p className="mt-1.5 text-sm text-slate-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
