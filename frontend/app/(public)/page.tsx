import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getData() {
  const base = process.env.BACKEND_API_BASE_URL ?? 'http://localhost:8000/api';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const opts = { signal: controller.signal, next: { revalidate: 60 } } as any;
    const [newsRes, eventsRes, achievementsRes] = await Promise.all([
      fetch(`${base}/public/news?limit=3`, opts).catch(() => null),
      fetch(`${base}/public/events?limit=4`, opts).catch(() => null),
      fetch(`${base}/public/achievements?limit=6`, opts).catch(() => null),
    ]);
    clearTimeout(timeout);
    return {
      news: newsRes?.ok ? await newsRes.json() : [],
      events: eventsRes?.ok ? await eventsRes.json() : [],
      achievements: achievementsRes?.ok ? await achievementsRes.json() : [],
    };
  } catch {
    return { news: [], events: [], achievements: [] };
  }
}

export default async function HomePage() {
  const { news, events, achievements } = await getData();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-24 text-white sm:py-32">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url(/images/1920x730_slide1.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-gray-900/80" />
        <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-gray-200 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            Admissions Open for 2025-2026
          </div>
          <h1 className="mt-8 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">MY ACADEMY</h1>
          <p className="mt-4 text-xl text-gray-200 sm:text-2xl">Gain More Knowledge</p>
          <p className="mt-1 text-sm text-gray-400">மேலும் அறிவு பெற | Since 2009 | Chennai</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/about" className="rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-gray-900 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">About Us</Link>
            <Link href="/contact" className="rounded-xl border border-white/30 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition-all duration-300 hover:bg-white/10">Admission Enquiry</Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-10 z-10 pb-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {[
              { value: '15+', label: 'Years' },
              { value: '200+', label: 'Students' },
              { value: '22', label: 'Staff' },
              { value: 'LKG-12', label: 'Standards' },
            ].map((stat, i) => (
              <div key={stat.label} className={`reveal reveal-delay-${i + 1} rounded-2xl bg-white p-5 text-center shadow-lg border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
                <div className="text-2xl font-extrabold text-gray-900 sm:text-3xl">{stat.value}</div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Welcome */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
            <div className="reveal-left">
              <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-600">About Us</div>
              <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">Excellence in Education Since 2009</h2>
              <p className="mt-5 text-gray-600 leading-relaxed">
                We established MY ACADEMY with a vision to provide quality education. Starting with just 10 students and 2 teachers, we&apos;ve grown to 200+ students with 22 dedicated staff members.
              </p>
              <p className="mt-3 text-gray-600 leading-relaxed">
                Our focus on discipline, smart work, and happiness creates an environment where students thrive academically and personally.
              </p>
              <div className="mt-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-5">
                <p className="text-sm italic text-gray-700">&ldquo;All of us do not have equal talents. But all of us have an equal opportunity to develop our talents.&rdquo;</p>
                <p className="mt-2 text-xs font-bold text-gray-500">— A.P.J. Abdul Kalam</p>
              </div>
            </div>
            <div className="reveal-right grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-gray-900 p-7 text-white transition-all duration-300 hover:-translate-y-1">
                <div className="text-3xl font-extrabold">100%</div>
                <div className="mt-2 text-sm text-gray-300">Pass Rate</div>
              </div>
              <div className="rounded-2xl bg-blue-600 p-7 text-white transition-all duration-300 hover:-translate-y-1">
                <div className="text-3xl font-extrabold">3</div>
                <div className="mt-2 text-sm text-blue-100">Curricula</div>
              </div>
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-7 transition-all duration-300 hover:-translate-y-1">
                <div className="text-3xl font-extrabold text-gray-900">🏆</div>
                <div className="mt-2 text-sm text-gray-600">Top Ranks Yearly</div>
              </div>
              <div className="rounded-2xl bg-yellow-50 border border-yellow-200 p-7 transition-all duration-300 hover:-translate-y-1">
                <div className="text-3xl font-extrabold text-yellow-700">24/7</div>
                <div className="mt-2 text-sm text-yellow-800">Exam Coaching</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Classes */}
      <section className="relative bg-gray-50 py-20 overflow-hidden">
        <div className="absolute inset-0 section-dot-pattern opacity-40" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center reveal">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-600">Programs</div>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Our Classes</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: '📚', title: 'Tuition Class', items: ['SAMACHEER - LKG to 10th', 'STATE BOARD - 11th & 12th', 'CBSE - LKG to 10th'] },
              { icon: '🎵', title: 'Music Class', items: ['Keyboard', 'Drums', 'Tabla'] },
              { icon: '☀️', title: 'Summer Class', items: ['Handwriting Improvement', 'Basic Maths', 'Reading & Writing'] },
            ].map((cls, i) => (
              <div key={cls.title} className={`reveal reveal-delay-${i + 1} group rounded-2xl bg-white p-8 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
                <div className="text-3xl">{cls.icon}</div>
                <h3 className="mt-4 text-xl font-bold text-gray-900">{cls.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {cls.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities */}
      <section className="gradient-border-top py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center reveal">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-green-600">Infrastructure</div>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Our Facilities</h2>
          </div>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'CCTV Surveillance', '24/7 Exam Coaching', 'Book Bank & Library',
              'Smart Classes', 'Morning Classes', 'Career Guidance',
              'Weekly Assessments', 'Exam Notes', 'Parent Meetings',
              'Savings Program', 'Alumni Network', 'Mineral Water',
            ].map((f, i) => (
              <div key={f} className={`reveal reveal-delay-${(i % 3) + 1} flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3.5 transition-all duration-200 hover:border-gray-200 hover:shadow-sm`}>
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-green-50 text-xs text-green-600">✓</div>
                <span className="text-sm font-medium text-gray-700">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      {achievements.length > 0 && (
        <section className="relative bg-gradient-to-br from-yellow-50/80 via-white to-orange-50/50 py-20 overflow-hidden">
          <div className="absolute top-10 right-10 h-40 w-40 rounded-full bg-yellow-200/30 blur-[60px]" />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center reveal">
              <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-yellow-600">Excellence</div>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">Our Achievements</h2>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((a: any) => (
                <div key={a.id} className="group rounded-2xl bg-white p-6 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-base font-bold text-gray-900">{a.student_name}</div>
                      <div className="mt-0.5 text-xs text-gray-500">{a.class_name} • {a.year}</div>
                    </div>
                    <span className="text-xl opacity-40 group-hover:opacity-100 transition-opacity">🏆</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {a.rank && <span className="rounded-lg bg-yellow-50 border border-yellow-200 px-2.5 py-1 text-[11px] font-bold text-yellow-700">Rank {a.rank}</span>}
                    {a.marks && <span className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-blue-700">{a.marks}</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link href="/achievements" className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-gray-800 hover:scale-105">View All</Link>
            </div>
          </div>
        </section>
      )}

      {/* Events */}
      <section className="bg-gray-900 py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center reveal">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-400">Calendar</div>
            <h2 className="mt-3 text-3xl font-bold">Upcoming Events</h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(events.length > 0 ? events : [
              { id: '1', title: 'Annual Day', date: '2024-12-29' },
              { id: '2', title: 'Admission Open', date: '2025-04-14' },
              { id: '3', title: 'Alumni Day', date: '2025-10-15' },
            ]).map((event: any) => (
              <div key={event.id} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-all duration-300 hover:bg-white/10 hover:-translate-y-1">
                {event.date && <div className="text-xs font-bold text-blue-400">{new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
                <h3 className="mt-2 text-base font-semibold">{event.title}</h3>
                {event.description && <p className="mt-2 text-sm text-gray-400 line-clamp-2">{event.description}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="relative py-16 bg-gradient-to-r from-blue-50 via-white to-purple-50 overflow-hidden">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[200px] font-serif text-blue-100/60 leading-none select-none">&ldquo;</div>
        <div className="reveal relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="text-lg italic text-gray-600 leading-relaxed">&ldquo;கல்வி என்பது பசுமை விரிந்த தோட்டம்; எல்லோருக்கும் கற்க வாய்ப்பு கொடுங்கள்.&rdquo;</p>
          <p className="mt-3 text-sm font-bold text-gray-500">— கே. காமராஜ்</p>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-32 w-[500px] rounded-full bg-blue-200/20 blur-[80px]" />
        <div className="reveal relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-gray-900">Ready to Join?</h2>
          <p className="mt-3 text-gray-600">Admission open every year from April 14th.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="rounded-xl bg-gray-900 px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-105">Enquire Now</Link>
            <a href="tel:04443568296" className="rounded-xl border-2 border-gray-900 px-8 py-3.5 text-sm font-bold text-gray-900 transition-all duration-300 hover:bg-gray-900 hover:text-white">Call: 044-4356 8296</a>
          </div>
        </div>
      </section>
    </div>
  );
}
