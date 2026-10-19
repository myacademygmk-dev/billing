import { ReactNode } from 'react';
import Link from 'next/link';
import { ScrollRevealProvider } from '@/components/ui/scroll-reveal-provider';
import { PublicNav } from '@/components/public/nav';
import { Marquee } from '@/components/public/marquee';
import { PopupBanner } from '@/components/public/popup-banner';
import { WebsiteConfigProvider, type WebsiteConfig } from '@/components/public/website-config-context';

async function getWebsiteConfig(): Promise<WebsiteConfig> {
  const base = process.env.BACKEND_API_BASE_URL ?? 'http://localhost:8000/api';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`${base}/public/website-config`, {
      signal: controller.signal,
      next: { revalidate: 60 },
    });
    return res.ok ? await res.json() : {};
  } catch {
    return {};
  } finally {
    clearTimeout(timeout);
  }
}

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const config = await getWebsiteConfig();
  const institution = config.institution ?? {};
  const email = institution.email || 'myacademy2009@gmail.com';
  const phone = institution.phone || '044-4356 8296';
  const registrationNo = institution.registration_no || 'RegNo: 469/2016';
  const topBarText = config.top_bar_text || 'Since 2009';

  return (
    <WebsiteConfigProvider config={config}>
      <div className="public-site min-h-dvh overflow-x-clip bg-white text-gray-900">
        {/* Popup Banner */}
        <PopupBanner />
        {/* Top bar */}
        <div className="hidden bg-[#0f172a] sm:block">
          <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 py-1.5 text-xs sm:px-6">
            <div className="flex min-w-0 items-center gap-4">
              <span className="truncate text-gray-300">Email: {email}</span>
              <span className="whitespace-nowrap text-gray-300">Phone: {phone}</span>
            </div>
          <div className="flex min-w-0 items-center justify-end gap-4">
            <span className="truncate text-[11px] font-semibold uppercase text-yellow-400">{topBarText}</span>
            <span className="truncate text-[11px] font-semibold text-yellow-400">{registrationNo}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-3">
            <img
              src="/images/logo.jpeg"
              alt="MY Academy Logo"
              className="size-10 object-contain sm:size-11"
            />
            <div>
              <div className="text-lg font-extrabold text-slate-900 sm:text-xl">
                MY ACADEMY
              </div>
              <div className="hidden text-[10px] font-semibold uppercase text-indigo-600 sm:block">
                Gain More Knowledge
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <PublicNav />
            <Link
              href="/login"
              className="hidden rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 xl:block"
            >
              Staff Login
            </Link>
          </div>
        </div>
      </header>

      {/* Marquee / News Ticker */}
      <Marquee />

      {/* Content */}
      <main>
        <ScrollRevealProvider />
        {children}
      </main>

      {/* Footer */}
      <footer className="relative bg-[#0f172a] pt-1 text-white">
        {/* Gradient accent line at top */}
        <div className="h-1 w-full bg-indigo-600" />

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3">
                <img src="/images/logo.jpeg" alt="MY Academy" className="h-12 w-12 object-contain" />
                <div>
                  <div className="text-lg font-extrabold text-white">MY ACADEMY</div>
                  <div className="text-xs font-semibold text-yellow-400">Educational Institutions</div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-400">
                Empowering students with quality education since 2009. Join our family of dedicated educators and motivated students.
              </p>
              {/* Social links */}
              <div className="mt-5 flex gap-3">
                {['facebook', 'instagram', 'youtube'].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="flex size-9 items-center justify-center rounded-md border border-white/10 text-gray-400 transition-colors duration-150 hover:border-indigo-400 hover:text-white"
                  >
                    <span className="text-xs font-bold uppercase">{social[0]}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">Quick Links</div>
              <div className="mt-4 space-y-3 text-sm text-gray-300">
                <div><Link href="/about" className="transition hover:text-white hover:translate-x-1 inline-block">About Us</Link></div>
                <div><Link href="/achievements" className="transition hover:text-white hover:translate-x-1 inline-block">Achievements</Link></div>
                <div><Link href="/gallery" className="transition hover:text-white hover:translate-x-1 inline-block">Gallery</Link></div>
                <div><Link href="/news" className="transition hover:text-white hover:translate-x-1 inline-block">News & Events</Link></div>
                <div><Link href="/timetable" className="transition hover:text-white hover:translate-x-1 inline-block">Timetable</Link></div>
                <div><Link href="/publications" className="transition hover:text-white hover:translate-x-1 inline-block">Publications</Link></div>
                <div><Link href="/payment-terms" className="transition hover:text-white hover:translate-x-1 inline-block">Payment Terms</Link></div>
                <div><Link href="/contact" className="transition hover:text-white hover:translate-x-1 inline-block">Contact Us</Link></div>
              </div>
            </div>

            {/* Programs */}
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">Programs</div>
              <div className="mt-4 space-y-3 text-sm text-gray-300">
                <div>Tuition (LKG - 12th)</div>
                <div>SAMACHEER / State / CBSE</div>
                <div>Music Classes</div>
                <div>Summer Classes</div>
                <div>Exam Coaching</div>
              </div>
            </div>

            {/* Contact */}
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">Contact</div>
              <div className="mt-4 space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span>20/4, Kalingarayan St, 1st Lane,<br />Old Washermenpet, Chennai-21</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 flex-shrink-0 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <span>044-4356 8296</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 flex-shrink-0 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <span>myacademy2009@gmail.com</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 border-t border-white/10 pt-6 text-center">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} MY ACADEMY. All Rights Reserved. | Designed with ❤️ for Excellence in Education.
            </p>
          </div>
        </div>
      </footer>
    </div>
    </WebsiteConfigProvider>
  );
}
