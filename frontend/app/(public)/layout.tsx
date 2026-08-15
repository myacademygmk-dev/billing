import { ReactNode } from 'react';
import Link from 'next/link';
import { ScrollRevealProvider } from '@/components/ui/scroll-reveal-provider';
import { PublicNav } from '@/components/public/nav';
import { Marquee } from '@/components/public/marquee';
import { PopupBanner } from '@/components/public/popup-banner';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Popup Banner */}
      <PopupBanner />
      {/* Top bar */}
      <div className="hidden bg-[#0f172a] sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 text-sm sm:px-6">
          <div className="flex items-center gap-5">
            <span className="text-gray-300">✉ myacademy2009@gmail.com</span>
            <span className="text-gray-300">✆ 044-4356 8296</span>
          </div>
          <div className="flex items-center gap-5">
            <span className="font-bold text-yellow-400">RegNo: 469/2016</span>
            <span className="font-medium text-gray-300">Since 2009</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white shadow-sm">
        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/images/logo.jpeg"
              alt="MY Academy Logo"
              className="h-12 w-12 object-contain transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14"
            />
            <div>
              <div className="text-2xl font-extrabold tracking-tight text-indigo-600 sm:text-[1.7rem]">
                MY ACADEMY
              </div>
              <div className="hidden text-[11px] font-bold uppercase tracking-[0.2em] text-yellow-500 sm:block">
                Gain More Knowledge
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <PublicNav />
            <Link
              href="/login"
              className="hidden rounded-lg bg-yellow-400 px-5 py-2.5 text-sm font-bold text-gray-900 shadow-md transition-all duration-300 hover:bg-yellow-300 hover:scale-105 hover:shadow-lg lg:block"
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
        <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-indigo-500 to-yellow-400" />

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
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-gray-400 transition-all duration-200 hover:bg-indigo-600 hover:text-white"
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
  );
}
