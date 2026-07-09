'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/achievements', label: 'Achievements' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/news', label: 'News' },
  { href: '/contact', label: 'Contact' },
];

export function PublicNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden items-center gap-5 text-[13px] font-medium text-gray-600 lg:flex">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`transition-colors duration-200 ${pathname === link.href ? 'text-gray-900 font-semibold' : 'hover:text-gray-900'}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 lg:hidden"
        aria-label="Toggle menu"
      >
        <div className="space-y-1">
          <span className={`block h-0.5 w-4 bg-gray-700 transition-all duration-200 ${open ? 'translate-y-[3px] rotate-45' : ''}`} />
          <span className={`block h-0.5 w-4 bg-gray-700 transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-4 bg-gray-700 transition-all duration-200 ${open ? '-translate-y-[3px] -rotate-45' : ''}`} />
        </div>
      </button>

      {/* Mobile dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 border-b border-gray-100 bg-white/95 backdrop-blur shadow-lg lg:hidden">
          <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${pathname === link.href ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-lg bg-gray-900 px-4 py-2.5 text-center text-sm font-bold text-white"
              >
                Staff Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
