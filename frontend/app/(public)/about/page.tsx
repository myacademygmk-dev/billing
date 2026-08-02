export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] py-16 sm:py-20">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-indigo-200">
            <span>Home</span>
            <span>/</span>
            <span className="text-white font-medium">About Us</span>
          </div>
          <h1 className="mt-4 text-4xl font-bold text-white sm:text-5xl">About Us</h1>
          <p className="mt-3 text-lg text-indigo-100">Discipline + Smart Work + Happiness = MY Academy</p>
        </div>
      </section>

      {/* History */}
      <section className="bg-[#f5f3ff] py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl text-center">
            <span className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] bg-clip-text text-transparent">Our History</span>
          </h2>

          {/* Timeline */}
          <div className="mt-12 relative">
            {/* Vertical line */}
            <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#7c3aed] via-[#4f46e5] to-[#0d9488] sm:left-[22px]" />

            {/* Milestone 1 */}
            <div className="relative pl-12 pb-10 sm:pl-14">
              <div className="absolute left-[7px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#7c3aed] ring-4 ring-[#f5f3ff] shadow-lg shadow-purple-500/30 sm:left-[10px] sm:h-7 sm:w-7">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-md border border-indigo-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
                <span className="inline-block rounded-full bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] px-3 py-1 text-xs font-bold text-white">June 4, 2009</span>
                <p className="mt-3 text-gray-600 leading-relaxed sm:text-lg">Established &ldquo;MY ACADEMY&rdquo; at Cemetery Road with <strong className="text-gray-900">10 students and 2 teachers</strong>.</p>
              </div>
            </div>

            {/* Milestone 2 */}
            <div className="relative pl-12 pb-10 sm:pl-14">
              <div className="absolute left-[7px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#4f46e5] ring-4 ring-[#f5f3ff] shadow-lg shadow-indigo-500/30 sm:left-[10px] sm:h-7 sm:w-7">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-md border border-indigo-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
                <span className="inline-block rounded-full bg-gradient-to-r from-[#4f46e5] to-[#0d9488] px-3 py-1 text-xs font-bold text-white">2010</span>
                <p className="mt-3 text-gray-600 leading-relaxed sm:text-lg">After many obstacles, moved to Old Washermenpet with <strong className="text-gray-900">40 students</strong>.</p>
              </div>
            </div>

            {/* Milestone 3 */}
            <div className="relative pl-12 sm:pl-14">
              <div className="absolute left-[7px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#0d9488] ring-4 ring-[#f5f3ff] shadow-lg shadow-teal-500/30 sm:left-[10px] sm:h-7 sm:w-7">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-md border border-indigo-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
                <span className="inline-block rounded-full bg-gradient-to-r from-[#0d9488] to-[#0f766e] px-3 py-1 text-xs font-bold text-white">Present</span>
                <p className="mt-3 text-gray-600 leading-relaxed sm:text-lg">Now proudly serving <strong className="text-gray-900">200+ students with 22 teaching staff</strong>.</p>
              </div>
            </div>
          </div>

          {/* Motto & Quote */}
          <div className="mt-12 rounded-2xl bg-white p-8 shadow-md border border-indigo-100 sm:p-10">
            <div className="rounded-xl bg-gradient-to-r from-[#f5f3ff] to-[#eef2ff] border border-indigo-100 p-6 text-center">
              <p className="text-xl font-bold bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] bg-clip-text text-transparent sm:text-2xl">&ldquo;GAIN MORE KNOWLEDGE&rdquo;</p>
              <p className="mt-2 text-sm text-gray-600">மேலும் அறிவு பெற</p>
            </div>
            <div className="mt-6 border-l-4 border-[#eab308] bg-[#fefce8] p-4 rounded-r-xl sm:p-5">
              <p className="text-sm font-medium text-gray-800 sm:text-base">In school, they teach a lesson and then give a test. In our institute, we give a test that teaches a lesson.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Managing Director */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="text-sm font-bold uppercase tracking-widest text-[#4f46e5]">Leadership</p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
            <span className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] bg-clip-text text-transparent">Our Managing Director</span>
          </h2>
          <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-start">
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <div className="h-36 w-36 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] flex items-center justify-center text-5xl text-white shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 text-center md:text-left">Mr. V. Pradeep Kumar</h3>
              <p className="mt-1 text-sm font-semibold text-[#4f46e5] text-center md:text-left">Founder & Managing Director</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                {['M.COM', 'M.B.A', 'Ph.D', '16+ Yrs'].map((q) => (
                  <span key={q} className="rounded-full bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] px-3 py-1 text-xs font-semibold text-white">{q}</span>
                ))}
              </div>
              <p className="mt-5 text-gray-600 leading-relaxed sm:text-base">
                Started his journey in 2006 providing career guidelines. In 2009, with his dedication and potential, he established MY ACADEMY. His experience and knowledge helps run the institute effectively, motivating all faculties to work hard for student success.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-[#f5f3ff] py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="text-sm font-bold uppercase tracking-widest text-[#0d9488]">Purpose</p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
            <span className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] bg-clip-text text-transparent">Mission & Vision</span>
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="group rounded-2xl bg-white p-8 shadow-md border border-indigo-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="mt-5 text-lg font-bold text-gray-900">Mission</h3>
              <p className="mt-3 text-gray-600 leading-relaxed">Providing comprehensive, individually focused learning that prepares students for academic and life success.</p>
            </div>
            <div className="group rounded-2xl bg-white p-8 shadow-md border border-indigo-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0d9488] to-[#0f766e] text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" /></svg>
              </div>
              <h3 className="mt-5 text-lg font-bold text-gray-900">Vision</h3>
              <p className="mt-3 text-gray-600 leading-relaxed">&ldquo;Improving lives through learning&rdquo; — Nurturing young minds and shaping future leaders.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities */}
      <section className="bg-[#0f172a] py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Facilities</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4">
            {[
              'CCTV Surveillance System', '24/7 Coaching During Exam Time',
              'Book Bank', 'Students Alumni Meet', 'Best Parent Desk',
              'Providing Examination Notes', 'Well Prepared Question Papers',
              'Mineral Water System', 'Savings Habit Program',
              'Weekly Test & General Library', 'Future Career Guidelines',
              'Morning Classes & Smart Classes', 'Special Examinations',
              'Individual Student Attention',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-4 transition-all duration-200 hover:bg-white/10">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#eab308] text-xs font-bold text-[#0f172a]">✓</span>
                <span className="text-sm font-medium text-gray-200">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inspired Legends */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">
            <span className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] bg-clip-text text-transparent">Our Inspired Legends</span>
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { name: 'K. Kamarajar', quote: 'கல்வி என்பது பசுமை விரிந்த தோட்டம்', icon: '🇮🇳' },
              { name: 'A.P.J. Abdul Kalam', quote: 'Equal opportunity to develop our talents', icon: '🚀' },
              { name: 'Swami Vivekananda', quote: 'Education is the manifestation of perfection', icon: '🙏' },
            ].map((legend) => (
              <div key={legend.name} className="group rounded-2xl bg-white p-6 shadow-md border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-2xl">{legend.icon}</div>
                <h4 className="mt-4 text-base font-bold text-gray-900">{legend.name}</h4>
                <p className="mt-2 text-sm italic text-gray-500">&ldquo;{legend.quote}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
