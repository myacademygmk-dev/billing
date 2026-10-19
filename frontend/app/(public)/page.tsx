import Link from 'next/link';
import { HeroSlideshow } from '@/components/public/hero-slideshow';
import { CountUpStats } from '@/components/public/count-up-stats';
import { OurVideos } from '@/components/public/our-videos';
import { StudentCreativity } from '@/components/public/student-creativity';
import { Countdown } from '@/components/public/countdown';
import { Card } from '@/components/ui/public-card';
import { AchievementCard } from '@/components/public/achievement-card';

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

const HOME_LINKS = [
  { href: '/about', label: 'About Us', description: 'Story, mission, management, faculty, facilities' },
  { href: '/classes', label: 'Classes', description: 'Tuition, music, and summer batches' },
  { href: '/achievements', label: 'Achievements', description: 'Student ranks, centums, and awards' },
  { href: '/gallery', label: 'Gallery', description: 'Academy photos and memories' },
  { href: '/news', label: 'News & Events', description: 'Latest updates and upcoming programs' },
  { href: '/student-corner/creativity', label: 'Creativity', description: 'Student artwork and submissions' },
  { href: '/student-corner/question-papers', label: 'Question Papers', description: 'Practice and exam resources' },
  { href: '/student-corner/results', label: 'Results', description: 'Published academic results' },
  { href: '/timetable', label: 'Timetable', description: 'Class and exam schedules' },
  { href: '/publications', label: 'Publications', description: 'Notes, circulars, and documents' },
  { href: '/payment-terms', label: 'Payment Terms', description: 'Fee and payment guidelines' },
  { href: '/admissions', label: 'Admissions', description: 'Admission information and enquiries' },
  { href: '/alumni', label: 'Alumni', description: 'Former student community' },
  { href: '/contact', label: 'Contact', description: 'Address, phone, and enquiry details' },
];

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
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
            {/* Left - Logo */}
            <div className="reveal-left">
              <div className="relative">
                <div className="aspect-[4/3] rounded-md border border-slate-200 bg-white overflow-hidden flex items-center justify-center p-8">
                  <img src="/images/logo.jpeg" alt="MY Academy" className="max-h-full max-w-full object-contain" />
                </div>
              </div>
            </div>

            {/* Right - Content */}
            <div className="reveal-right">
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-teal-600">About Us</div>
              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                <span className="text-indigo-700">Excellence in Education</span>
                <br />
                <span className="text-gray-900">Since 2009</span>
              </h2>
              <p className="mt-5 text-gray-600 leading-relaxed text-base">
                We established MY ACADEMY with a vision to provide quality education. Starting with just 10 students and 2 teachers, we&apos;ve grown to 200+ students with 22 dedicated staff members.
              </p>
              <p className="mt-3 text-gray-600 leading-relaxed text-base">
                Our focus on discipline, smart work, and happiness creates an environment where students thrive academically and personally.
              </p>
              <div className="mt-6 border-l-4 border-indigo-600 bg-indigo-50 p-5">
                <p className="text-sm italic text-gray-700">&ldquo;All of us do not have equal talents. But all of us have an equal opportunity to develop our talents.&rdquo;</p>
                <p className="mt-2 text-xs font-bold text-indigo-600">— A.P.J. Abdul Kalam</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          OUR VIDEOS SECTION
          ═══════════════════════════════════════════════ */}
      <OurVideos />

      {/* ═══════════════════════════════════════════════
          COUNTDOWN SECTION
          ═══════════════════════════════════════════════ */}
      <Countdown />

      {/* ═══════════════════════════════════════════════
          CLASSES SECTION
          ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-14 bg-[#f5f3ff]">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center reveal">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600">Programs</div>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              <span>Our Classes</span>
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
              <article key={cls.title} className={`reveal reveal-delay-${i + 1} relative overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm`}>
                <div className="relative p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className={`flex size-12 shrink-0 items-center justify-center rounded-md ring-1 ring-inset ring-black/5 ${cls.iconBg} ${cls.iconColor}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                        {cls.icon}
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1 text-right">
                      <h3 className="text-xl font-extrabold text-slate-900">{cls.title}</h3>
                      <p className="mt-1 text-sm font-medium text-slate-500">{cls.tagline}</p>
                    </div>
                  </div>
                  <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-5">
                    {cls.items.map((item) => (
                      <li key={item} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 shrink-0 ${cls.checkColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          STUDENT CREATIVITY
          ═══════════════════════════════════════════════ */}
      <StudentCreativity />

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
                <span className="text-indigo-700">Our Achievements</span>
              </h2>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((a: any, i: number) => (
                <div key={a.id} className={`reveal reveal-delay-${(i % 6) + 1}`}><AchievementCard achievement={a} /></div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link href="/achievements" className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-700">
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
            <div className="mt-8 grid gap-4 lg:grid-cols-4">
              {events.map((event: any, i: number) => (
                <Card key={event.id} tone="dark" className={`reveal reveal-delay-${(i % 6) + 1} overflow-hidden ${i === 0 ? 'lg:col-span-2 lg:row-span-2' : ''}`}>
                  <div className={`${i === 0 ? 'p-7 sm:p-8' : 'p-5'} relative h-full`}>
                    <div className="absolute left-0 top-0 h-full w-1 bg-yellow-400" />
                    {event.date && (
                      <div className="inline-flex items-center rounded-full bg-yellow-400 px-3 py-1 text-xs font-extrabold text-slate-950">
                        {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                    <h3 className={`${i === 0 ? 'mt-5 text-2xl sm:text-3xl' : 'mt-4 text-lg'} font-extrabold text-white`}>{event.title}</h3>
                    {event.description && <p className={`${i === 0 ? 'mt-4 text-base line-clamp-5' : 'mt-2 text-sm line-clamp-3'} text-slate-300`}>{event.description}</p>}
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
                <span className="text-indigo-700">News & Updates</span>
              </h2>
            </div>
            <div className="mt-8 grid gap-5 lg:grid-cols-5">
              {news.map((item: any, i: number) => (
                <Card key={item.id} className={`reveal reveal-delay-${(i % 6) + 1} overflow-hidden ${i === 0 ? 'lg:col-span-3 lg:row-span-3' : 'lg:col-span-2'}`}>
                  {/* Image */}
                  <div className={`${i === 0 ? 'aspect-[16/8]' : 'hidden'} bg-slate-100 overflow-hidden`}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <img src={`/images/360x220_img${7 + (i % 3)}.jpg`} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    )}
                  </div>
                  <div className={i === 0 ? 'p-6' : 'border-l-4 border-indigo-500 p-5'}>
                    {item.date && (
                      <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-700">
                        {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                    <h3 className={`${i === 0 ? 'mt-4 text-2xl' : 'mt-3 text-lg'} font-extrabold text-slate-900 transition-colors group-hover:text-indigo-600`}>{item.title}</h3>
                    {item.description && <p className={`${i === 0 ? 'mt-3 text-base line-clamp-3' : 'mt-2 text-sm line-clamp-2'} text-slate-500`}>{item.description}</p>}
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link href="/news" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 transition-colors hover:text-indigo-800">
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
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center reveal">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-teal-600">Explore</div>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">Find Everything Quickly</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500">
              Direct links to every important public page and student resource.
            </p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {HOME_LINKS.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group reveal reveal-delay-${(index % 6) + 1} rounded-md border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-indigo-200 hover:bg-indigo-50`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-indigo-600 ring-1 ring-slate-200 transition-colors group-hover:bg-indigo-600 group-hover:text-white group-hover:ring-indigo-600">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-slate-900">{item.label}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

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
       <section className="relative overflow-hidden bg-amber-300 py-14">

        <div className="reveal relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Ready to Join Our Family?</h2>
          <p className="mt-3 text-gray-700 text-lg font-medium">Admission open every year from April 14th. Limited seats available.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="rounded-md bg-indigo-600 px-8 py-4 text-base font-bold text-white transition-colors hover:bg-indigo-700"
            >
              Enquire Now
            </Link>
            <a
              href="tel:04443568296"
              className="rounded-md border border-gray-900 px-8 py-4 text-base font-bold text-gray-900 transition-colors hover:bg-gray-900 hover:text-white"
            >
              Call: 044-4356 8296
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
