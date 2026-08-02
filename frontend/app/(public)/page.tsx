import Link from 'next/link';
import { HeroSlideshow } from '@/components/public/hero-slideshow';
import { CountUpStats } from '@/components/public/count-up-stats';

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
      {/* ═══════════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-[600px] flex items-center">
        {/* Background Slideshow */}
        <HeroSlideshow />

        {/* Geometric SVG Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.08]">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
        </div>

        {/* Geometric decorative shapes */}
        <div className="absolute top-20 right-20 h-32 w-32 rotate-45 border-2 border-yellow-400/20 hidden lg:block" />
        <div className="absolute bottom-32 left-16 h-24 w-24 rotate-12 border-2 border-teal-400/20 hidden lg:block" />
        <div className="absolute top-40 left-1/4 h-4 w-4 rotate-45 bg-yellow-400/30 hidden lg:block" />
        <div className="absolute bottom-48 right-1/3 h-3 w-3 rounded-full bg-teal-400/40 hidden lg:block" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 sm:py-32">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            MY ACADEMY
          </h1>
          <p className="mt-4 text-2xl font-bold text-yellow-400 sm:text-3xl">
            Gain More Knowledge
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/about"
              className="rounded-xl bg-yellow-400 px-8 py-4 text-base font-bold text-gray-900 shadow-lg shadow-yellow-400/20 transition-all duration-300 hover:scale-105 hover:bg-yellow-300 hover:shadow-xl"
            >
              Learn More
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border-2 border-white/30 bg-white/5 px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:bg-white/10 hover:border-white/50"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          COUNT-UP STATS (Overlapping hero)
          ═══════════════════════════════════════════════ */}
      <CountUpStats />

      {/* ═══════════════════════════════════════════════
          ABOUT SECTION
          ═══════════════════════════════════════════════ */}
      <section className="relative py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
            {/* Left - Image placeholder */}
            <div className="reveal-left">
              <div className="relative">
                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-50 border border-indigo-100 overflow-hidden">
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl">🏫</div>
                      <p className="mt-3 text-sm font-semibold text-indigo-400">MY Academy Campus</p>
                    </div>
                  </div>
                </div>
                {/* Decorative accent */}
                <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 -z-10" />
                <div className="absolute -top-4 -left-4 h-16 w-16 rounded-xl bg-indigo-600/10 border border-indigo-600/20 -z-10" />
              </div>
            </div>

            {/* Right - Content */}
            <div className="reveal-right">
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-teal-600">About Us</div>
              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Excellence in Education
                </span>
                <br />
                <span className="text-gray-900">Since 2009</span>
              </h2>
              <p className="mt-5 text-gray-600 leading-relaxed text-base">
                We established MY ACADEMY with a vision to provide quality education. Starting with just 10 students and 2 teachers, we&apos;ve grown to 200+ students with 22 dedicated staff members.
              </p>
              <p className="mt-3 text-gray-600 leading-relaxed text-base">
                Our focus on discipline, smart work, and happiness creates an environment where students thrive academically and personally.
              </p>
              <div className="mt-6 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-5">
                <p className="text-sm italic text-gray-700">&ldquo;All of us do not have equal talents. But all of us have an equal opportunity to develop our talents.&rdquo;</p>
                <p className="mt-2 text-xs font-bold text-indigo-600">— A.P.J. Abdul Kalam</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CLASSES SECTION
          ═══════════════════════════════════════════════ */}
      <section className="relative py-20 bg-[#f5f3ff]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center reveal">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600">Programs</div>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Our Classes</span>
            </h2>
            <p className="mt-3 text-gray-500 max-w-lg mx-auto">Comprehensive education programs designed for every student&apos;s growth and success.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: '📚', title: 'Tuition Class', items: ['SAMACHEER - LKG to 10th', 'STATE BOARD - 11th & 12th', 'CBSE - LKG to 10th'], borderColor: 'border-l-indigo-600', iconBg: 'bg-indigo-50' },
              { icon: '🎵', title: 'Music Class', items: ['Keyboard', 'Drums', 'Tabla'], borderColor: 'border-l-teal-500', iconBg: 'bg-teal-50' },
              { icon: '☀️', title: 'Summer Class', items: ['Handwriting Improvement', 'Basic Maths', 'Reading & Writing'], borderColor: 'border-l-yellow-400', iconBg: 'bg-yellow-50' },
            ].map((cls, i) => (
              <div key={cls.title} className={`reveal reveal-delay-${i + 1} group rounded-2xl bg-white p-8 shadow-sm border-l-4 ${cls.borderColor} transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${cls.iconBg} text-2xl`}>
                  {cls.icon}
                </div>
                <h3 className="mt-5 text-xl font-bold text-gray-900">{cls.title}</h3>
                <ul className="mt-4 space-y-3">
                  {cls.items.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FACILITIES — Dark Section
          ═══════════════════════════════════════════════ */}
      <section className="relative py-20 bg-[#0f172a] overflow-hidden">
        {/* Geometric pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="facilities-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#facilities-pattern)" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center reveal">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-teal-400">Infrastructure</div>
            <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">Our Facilities</h2>
            <p className="mt-3 text-gray-400 max-w-lg mx-auto">World-class infrastructure to support holistic learning and development.</p>
          </div>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'CCTV Surveillance', '24/7 Exam Coaching', 'Book Bank & Library',
              'Smart Classes', 'Morning Classes', 'Career Guidance',
              'Weekly Assessments', 'Exam Notes', 'Parent Meetings',
              'Savings Program', 'Alumni Network', 'Mineral Water',
            ].map((f, i) => (
              <div key={f} className={`reveal reveal-delay-${(i % 3) + 1} flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-4 transition-all duration-300 hover:bg-white/10 hover:border-teal-400/30`}>
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-teal-500/20 text-sm text-teal-400 font-bold">✓</div>
                <span className="text-sm font-medium text-gray-200">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          ACHIEVEMENTS
          ═══════════════════════════════════════════════ */}
      {achievements.length > 0 && (
        <section className="relative py-20 bg-[#fefce8] overflow-hidden">
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center reveal">
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-600">Excellence</div>
              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Our Achievements</span>
              </h2>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((a: any) => (
                <div key={a.id} className="group rounded-2xl bg-white p-6 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-base font-bold text-gray-900">{a.student_name}</div>
                      <div className="mt-0.5 text-xs text-gray-500">{a.class_name} • {a.year}</div>
                    </div>
                    {/* Yellow rank badge */}
                    {a.rank && (
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-sm font-extrabold text-gray-900 shadow-sm">
                        #{a.rank}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {a.marks && (
                      <span className="rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-bold text-indigo-600">
                        {a.marks}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link href="/achievements" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:bg-indigo-700 hover:scale-105 shadow-md">
                View All Achievements
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          EVENTS — Dark Section with Dot Pattern
          ═══════════════════════════════════════════════ */}
      <section className="relative py-20 bg-[#0f172a] text-white overflow-hidden">
        {/* Subtle geometric dot pattern */}
        <div className="absolute inset-0 opacity-[0.06]">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="events-dots" width="32" height="32" patternUnits="userSpaceOnUse">
                <circle cx="16" cy="16" r="1.2" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#events-dots)" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center reveal">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">Calendar</div>
            <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">Upcoming Events</h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(events.length > 0 ? events : [
              { id: '1', title: 'Annual Day', date: '2024-12-29', description: 'Join us for the annual celebration of talent and achievements.' },
              { id: '2', title: 'Admission Open', date: '2025-04-14', description: 'New academic year admissions begin. Limited seats available.' },
              { id: '3', title: 'Alumni Day', date: '2025-10-15', description: 'Reconnect with old friends and celebrate together.' },
            ]).map((event: any) => (
              <div key={event.id} className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 hover:border-yellow-400/30">
                {event.date && (
                  <div className="inline-flex items-center rounded-lg bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-400">
                    {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                )}
                <h3 className="mt-3 text-lg font-bold">{event.title}</h3>
                {event.description && <p className="mt-2 text-sm text-gray-400 line-clamp-2">{event.description}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          NEWS — Clean White Section
          ═══════════════════════════════════════════════ */}
      {news.length > 0 && (
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center reveal">
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600">Latest</div>
              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">News & Updates</span>
              </h2>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {news.map((item: any) => (
                <div key={item.id} className="group rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  {/* Image placeholder */}
                  <div className="aspect-[16/9] bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                    <div className="text-4xl opacity-30">📰</div>
                  </div>
                  <div className="p-5">
                    {item.date && (
                      <span className="inline-flex rounded-md bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-600">
                        {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                    <h3 className="mt-2 text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                    {item.content && <p className="mt-2 text-sm text-gray-500 line-clamp-2">{item.content}</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link href="/news" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                View All News
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          QUOTE
          ═══════════════════════════════════════════════ */}
      <section className="relative py-16 bg-[#fefce8] overflow-hidden">
        {/* Decorative quotes */}
        <div className="absolute left-8 top-8 text-[120px] font-serif text-yellow-400/20 leading-none select-none hidden lg:block">&ldquo;</div>
        <div className="reveal relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="text-lg italic text-gray-700 leading-relaxed">&ldquo;கல்வி என்பது பசுமை விரிந்த தோட்டம்; எல்லோருக்கும் கற்க வாய்ப்பு கொடுங்கள்.&rdquo;</p>
          <p className="mt-3 text-sm font-bold text-indigo-600">— கே. காமராஜ்</p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CTA — Yellow Gradient Banner
          ═══════════════════════════════════════════════ */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400">
        {/* Geometric decorations */}
        <div className="absolute top-6 left-10 h-20 w-20 rotate-12 border-2 border-yellow-600/20 rounded-xl hidden lg:block" />
        <div className="absolute bottom-6 right-10 h-16 w-16 rotate-45 border-2 border-yellow-600/20 hidden lg:block" />

        <div className="reveal relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Ready to Join Our Family?</h2>
          <p className="mt-3 text-gray-700 text-lg font-medium">Admission open every year from April 14th. Limited seats available.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="rounded-xl bg-indigo-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-indigo-600/30 transition-all duration-300 hover:scale-105 hover:bg-indigo-700 hover:shadow-xl"
            >
              Enquire Now
            </Link>
            <a
              href="tel:04443568296"
              className="rounded-xl border-2 border-gray-900 px-8 py-4 text-base font-bold text-gray-900 transition-all duration-300 hover:bg-gray-900 hover:text-white"
            >
              Call: 044-4356 8296
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
