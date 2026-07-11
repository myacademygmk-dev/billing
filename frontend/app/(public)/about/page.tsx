export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gray-900 py-14 text-white sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-400">About Us</div>
          <h1 className="mt-3 text-3xl font-bold sm:text-5xl">Our Story</h1>
          <p className="mt-3 text-gray-400">Discipline + Smart Work + Happiness = MY Academy</p>
        </div>
      </section>

      {/* History */}
      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="reveal rounded-2xl bg-white p-6 shadow-sm border border-gray-100 sm:p-10">
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Our History</h2>
            <div className="mt-5 space-y-3 text-sm text-gray-600 leading-relaxed sm:text-base sm:space-y-4">
              <p>In the year of <strong className="text-gray-900">2009 on June 4th</strong>, we established &ldquo;MY ACADEMY&rdquo; at Cemetery Road with <strong className="text-gray-900">10 students and 2 teachers</strong>.</p>
              <p>After many obstacles, in 2010 we moved to Old Washermenpet with 40 students. Now, we proudly serve <strong className="text-gray-900">200+ students with 22 teaching staff</strong>.</p>
            </div>
            <div className="reveal reveal-delay-2 mt-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4 text-center sm:p-6">
              <p className="text-lg font-bold text-blue-700 sm:text-xl">&ldquo;GAIN MORE KNOWLEDGE&rdquo;</p>
              <p className="mt-1 text-xs text-gray-600 sm:text-sm">மேலும் அறிவு பெற</p>
            </div>
            <p className="reveal reveal-delay-3 mt-5 text-xs font-medium text-gray-800 bg-gray-50 border border-gray-100 p-3 rounded-xl sm:text-sm sm:p-4">💡 In school, they teach a lesson and then give a test. In our institute, we give a test that teaches a lesson.</p>
          </div>
        </div>
      </section>

      {/* Managing Director */}
      <section className="relative bg-gradient-to-br from-gray-50 via-white to-purple-50/30 py-14 overflow-hidden sm:py-16">
        <div className="absolute top-10 right-10 h-40 w-40 rounded-full bg-purple-200/20 blur-[60px]" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-purple-600">Leadership</div>
          <h2 className="mt-3 text-xl font-bold text-gray-900 sm:text-2xl">Our Managing Director</h2>
          <div className="reveal mt-8 flex flex-col gap-6 sm:mt-10 md:flex-row md:items-start md:gap-8">
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <div className="h-28 w-28 rounded-2xl bg-gray-200 border border-gray-300 flex items-center justify-center text-4xl shadow-sm sm:h-36 sm:w-36 sm:text-5xl">👤</div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 text-center md:text-left sm:text-xl">Mr. V. Pradeep Kumar</h3>
              <p className="mt-1 text-sm font-medium text-blue-600 text-center md:text-left">Founder & Managing Director</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
                {['M.COM', 'M.B.A', 'Ph.D', '16+ Yrs'].map((q) => (
                  <span key={q} className="rounded-lg bg-white border border-gray-200 px-2.5 py-1 text-[10px] font-semibold text-gray-700 shadow-sm sm:text-[11px] sm:px-3">{q}</span>
                ))}
              </div>
              <p className="mt-4 text-xs text-gray-600 leading-relaxed sm:mt-5 sm:text-sm">
                Started his journey in 2006 providing career guidelines. In 2009, with his dedication and potential, he established MY ACADEMY. His experience and knowledge helps run the institute effectively, motivating all faculties to work hard for student success.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="gradient-border-top py-14 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-green-600">Purpose</div>
          <h2 className="mt-3 text-xl font-bold text-gray-900 sm:text-2xl">Mission & Vision</h2>
          <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-6 md:grid-cols-2">
            <div className="reveal reveal-delay-1 rounded-2xl border border-blue-100 bg-blue-50/50 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 sm:p-8">
              <div className="text-2xl">🎯</div>
              <h3 className="mt-3 text-base font-bold text-gray-900 sm:text-lg">Mission</h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed sm:mt-3 sm:text-sm">Providing comprehensive, individually focused learning that prepares students for academic and life success.</p>
            </div>
            <div className="reveal reveal-delay-2 rounded-2xl border border-purple-100 bg-purple-50/50 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 sm:p-8">
              <div className="text-2xl">🔭</div>
              <h3 className="mt-3 text-base font-bold text-gray-900 sm:text-lg">Vision</h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed sm:mt-3 sm:text-sm">&ldquo;Improving lives through learning&rdquo; — Nurturing young minds and shaping future leaders.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities */}
      <section className="relative bg-gray-50 py-14 overflow-hidden sm:py-16">
        <div className="absolute inset-0 section-dot-pattern opacity-30" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="reveal text-xl font-bold text-gray-900 sm:text-2xl">Facilities</h2>
          <div className="mt-6 grid gap-2 sm:mt-8 sm:grid-cols-2 sm:gap-3">
            {[
              'CCTV Surveillance System', '24/7 Coaching During Exam Time',
              'Book Bank', 'Students Alumni Meet', 'Best Parent Desk',
              'Providing Examination Notes', 'Well Prepared Question Papers',
              'Mineral Water System', 'Savings Habit Program',
              'Weekly Test & General Library', 'Future Career Guidelines',
              'Morning Classes & Smart Classes', 'Special Examinations',
              'Individual Student Attention',
            ].map((f, i) => (
              <div key={f} className={`reveal reveal-delay-${(i % 3) + 1} flex items-center gap-3 rounded-xl bg-white border border-gray-100 p-3 transition-all duration-200 hover:shadow-sm sm:p-4`}>
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-green-50 text-[9px] text-green-600 sm:h-6 sm:w-6 sm:text-[10px]">✓</span>
                <span className="text-xs font-medium text-gray-700 sm:text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inspired Legends */}
      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="reveal text-xl font-bold text-gray-900 sm:text-2xl">Our Inspired Legends</h2>
          <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-6 md:grid-cols-3">
            {[
              { name: 'K. Kamarajar', quote: 'கல்வி என்பது பசுமை விரிந்த தோட்டம்', emoji: '🇮🇳' },
              { name: 'A.P.J. Abdul Kalam', quote: 'Equal opportunity to develop our talents', emoji: '🚀' },
              { name: 'Swami Vivekananda', quote: 'Education is the manifestation of perfection', emoji: '🙏' },
            ].map((legend, i) => (
              <div key={legend.name} className={`reveal reveal-delay-${i + 1} rounded-2xl bg-white border border-gray-100 p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 sm:p-6`}>
                <div className="text-3xl">{legend.emoji}</div>
                <h4 className="mt-3 text-sm font-bold text-gray-900 sm:text-base">{legend.name}</h4>
                <p className="mt-2 text-[11px] italic text-gray-500 sm:text-xs">&ldquo;{legend.quote}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
