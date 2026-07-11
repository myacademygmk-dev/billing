import { ReactNode } from 'react';
import Link from 'next/link';
import { ScrollRevealProvider } from '@/components/ui/scroll-reveal-provider';
import { PublicNav } from '@/components/public/nav';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="public-bg min-h-screen text-gray-900">
      {/* Top bar - hidden on mobile */}
      <div className="hidden bg-gray-900 text-white sm:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-[11px] text-gray-300 sm:px-6">
          <div className="flex items-center gap-4">
            <span>✉ myacademy2009@gmail.com</span>
            <span>✆ 044-4356 8296</span>
          </div>
          <div className="flex items-center gap-4">
            <span>RegNo: 469/2016</span>
            <span>Since 2009</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur shadow-sm">
        <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="flex items-center gap-2.5 group sm:gap-3">
            <img src="/images/logo.png" alt="MY Academy Logo" className="h-9 w-9 rounded-lg object-contain transition-transform group-hover:scale-105 sm:h-11 sm:w-11 sm:rounded-xl" />
            <div>
              <div className="text-base font-bold tracking-tight sm:text-lg">MY ACADEMY</div>
              <div className="hidden text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-500 sm:block">Gain More Knowledge</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <PublicNav />
            <Link href="/login" className="hidden rounded-lg bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-gray-800 transition-all hover:scale-105 lg:block">
              Staff Login
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main>
        <ScrollRevealProvider />
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 py-10 text-white sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 md:gap-10">
            <div>
              <img src="/images/logo.png" alt="MY Academy" className="h-10 w-10 rounded-lg sm:h-12 sm:w-12 sm:rounded-xl" />
              <div className="mt-3 text-sm font-bold sm:text-base">MY ACADEMY</div>
              <div className="mt-1 text-[11px] text-gray-400 sm:text-xs">Educational Institutions</div>
              <p className="mt-2 text-[11px] text-gray-500 italic sm:mt-3 sm:text-xs">&ldquo;Gain More Knowledge&rdquo;<br />மேலும் அறிவு பெற</p>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Navigation</div>
              <div className="mt-3 space-y-2 text-sm text-gray-400 sm:mt-4 sm:space-y-2.5">
                <div><Link href="/about" className="hover:text-white transition">About Us</Link></div>
                <div><Link href="/achievements" className="hover:text-white transition">Achievements</Link></div>
                <div><Link href="/gallery" className="hover:text-white transition">Gallery</Link></div>
                <div><Link href="/news" className="hover:text-white transition">News & Events</Link></div>
                <div><Link href="/contact" className="hover:text-white transition">Contact Us</Link></div>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Programs</div>
              <div className="mt-3 space-y-2 text-sm text-gray-400 sm:mt-4 sm:space-y-2.5">
                <div>Tuition (LKG - 12th)</div>
                <div>SAMACHEER / State / CBSE</div>
                <div>Music Classes</div>
                <div>Summer Classes</div>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Contact</div>
              <div className="mt-3 space-y-2 text-sm text-gray-400 sm:mt-4 sm:space-y-2.5">
                <div>20/4, Kalingarayan St, 1st Lane,<br />Old Washermenpet, Chennai-21</div>
                <div>044-4356 8296</div>
                <div>myacademy2009@gmail.com</div>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-5 text-center text-[10px] text-gray-600 sm:mt-10 sm:pt-6 sm:text-[11px]">
            © {new Date().getFullYear()} MY ACADEMY. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
