import Link from 'next/link';
import { HeroSlideshow } from '@/components/public/hero-slideshow';
import { CountUpStats } from '@/components/public/count-up-stats';
import { Card, RankRibbon, rankCardTint, rankHoverGlow } from '@/components/ui/public-card';
import { AchievementMedal } from '@/components/ui/achievement-medal';
import { GlowOrb } from '@/components/ui/glow-orb';

export const revalidate = 60;

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
      <section className="relative overflow-hidden">
        <HeroSlideshow />
      </section>

      {/* ═══════════════════════════════════════════════
          COUNT-UP STATS (Overlapping hero)
          ═══════════════════════════════════════════════ */}
      <CountUpStats />

      {/* ═══════════════════════════════════════════════
          ABOUT SECTION
          ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-14 sm:py-16">
        <GlowOrb color="bg-indigo-100/50" className="-right-24 top-0 h-72 w-72" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
            {/* Left - Logo */}
            <div className="reveal-left">
              <div className="relative">
                <div className="aspect-[4/3] rounded-2xl border border-indigo-100 bg-white overflow-hidden flex items-center justify-center p-8">
                  <img src="/images/logo.jpeg" alt="MY Academy" className="max-h-full max-w-full object-contain" />
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
      <section className="relative overflow-hidden py-14 bg-[#f5f3ff]">
        <GlowOrb color="bg-violet-200/40" className="-left-20 -bottom-20 h-72 w-72" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center reveal">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600">Programs</div>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Our Classes</span>
            </h2>
            <p className="mt-2 text-sm text-gray-500 max-w-lg mx-auto">Comprehensive education programs designed for every student&apos;s growth and success.</p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              {
                title: 'Tuition Class',
                tagline: 'LKG to 12th, all boards',
                items: ['SAMACHEER — LKG to 10th', 'State Board — 11th & 12th', 'CBSE — LKG to 10th'],
                iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', checkColor: 'text-indigo-500',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />,
              },
              {
                title: 'Music Class',
                tagline: 'Keyboard, Drums & Tabla',
                items: ['Keyboard', 'Drums', 'Tabla'],
                iconBg: 'bg-violet-50', iconColor: 'text-violet-600', checkColor: 'text-violet-500',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />,
              },
              {
                title: 'Summer Class',
                tagline: 'Holiday skill-building batch',
                items: ['Handwriting Improvement', 'Basic Maths', 'Reading & Writing'],
                iconBg: 'bg-amber-50', iconColor: 'text-amber-600', checkColor: 'text-amber-500',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />,
              },
            ].map((cls, i) => (
              <Card key={cls.title} className={`reveal reveal-delay-${i + 1}`}>
                <div className="p-5">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${cls.iconBg} ${cls.iconColor}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                        {cls.icon}
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{cls.title}</h3>
                      <p className="text-xs text-slate-400">{cls.tagline}</p>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                    {cls.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${cls.checkColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FACILITIES — Dark Section
          ═══════════════════════════════════════════════ */}
      <section className="relative py-14 bg-[#0f172a] overflow-hidden">
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
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'CCTV Surveillance', '24/7 Exam Coaching', 'Book Bank & Library',
              'Smart Classes', 'Morning Classes', 'Career Guidance',
              'Weekly Assessments', 'Exam Notes', 'Parent Meetings',
              'Savings Program', 'Alumni Network', 'Mineral Water',
            ].map((f, i) => (
              <Card key={f} tone="dark" interactive={false} className={`reveal reveal-delay-${(i % 3) + 1}`}>
                <div className="flex items-center gap-3 px-5 py-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-sm font-medium text-slate-300">{f}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          ACHIEVEMENTS
          ═══════════════════════════════════════════════ */}
      {achievements.length > 0 && (
        <section className="relative py-14 bg-[#fefce8] overflow-hidden">
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center reveal">
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-600">Excellence</div>
              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Our Achievements</span>
              </h2>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((a: any, i: number) => (
                <Card key={a.id} className={`reveal reveal-delay-${(i % 6) + 1} overflow-hidden transition-transform hover:-translate-y-0.5 ${rankCardTint(a.rank)} ${rankHoverGlow(a.rank)}`}>
                  <RankRibbon rank={a.rank} />
                  <div className="flex items-start gap-3 p-4 pb-3">
                    <AchievementMedal rank={a.rank} marks={a.marks} size="sm" />
                    <div className="min-w-0 pt-0.5">
                      <div className="text-[15px] font-semibold text-slate-900 leading-tight truncate pr-6">{a.student_name}</div>
                      <div className="mt-1 text-xs text-slate-500">{a.class_name} • {a.year}</div>
                    </div>
                  </div>
                  {a.marks && (
                    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Marks</span>
                      <span className="text-sm font-semibold text-slate-900 tabular-nums">{a.marks}</span>
                    </div>
                  )}
                </Card>
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
      {events.length > 0 && (
        <section className="relative py-14 bg-[#0f172a] text-white overflow-hidden">
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
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event: any, i: number) => (
                <Card key={event.id} tone="dark" className={`reveal reveal-delay-${(i % 6) + 1}`}>
                  <div className="p-6">
                    {event.date && (
                      <div className="inline-flex items-center rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-300">
                        {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                    <h3 className="mt-3 text-lg font-semibold text-white">{event.title}</h3>
                    {event.description && <p className="mt-2 text-sm text-slate-400 line-clamp-2">{event.description}</p>}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          NEWS — Clean White Section
          ═══════════════════════════════════════════════ */}
      {news.length > 0 && (
        <section className="py-14 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center reveal">
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600">Latest</div>
              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">News & Updates</span>
              </h2>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {news.map((item: any, i: number) => (
                <Card key={item.id} className={`reveal reveal-delay-${(i % 6) + 1} overflow-hidden`}>
                  {/* Image */}
                  <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <img src={`/images/360x220_img${7 + (i % 3)}.jpg`} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    )}
                  </div>
                  <div className="p-5">
                    {item.date && (
                      <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                        {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                    <h3 className="mt-2 text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                    {item.content && <p className="mt-2 text-sm text-slate-500 line-clamp-2">{item.content}</p>}
                  </div>
                </Card>
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
      <section className="relative py-12 bg-[#fefce8] overflow-hidden">
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
      <section className="relative py-14 overflow-hidden bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400">
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
