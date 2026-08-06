'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/faculty', label: 'Faculty' },
  { href: '/facilities', label: 'Facilities' },
  { href: '/achievements', label: 'Achievements' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/alumni', label: 'Alumni' },
  { href: '/news', label: 'News' },
  { href: '/contact', label: 'Contact' },
];

export function PublicNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden items-center gap-1 lg:flex">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`relative px-3 py-2 text-base font-semibold transition-colors duration-200 hover:text-indigo-600 ${
              pathname === link.href
                ? 'text-indigo-600'
                : 'text-gray-700'
            }`}
          >
            {link.label}
            {/* Active indicator */}
            {pathname === link.href && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-yellow-400" />
            )}
            {/* Hover underline animation */}
            <span className="absolute bottom-0 left-3 right-3 h-0.5 origin-left scale-x-0 rounded-full bg-indigo-600/30 transition-transform duration-300 group-hover:scale-x-100" />
          </Link>
        ))}
      </nav>

      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 transition-colors hover:bg-indigo-100 lg:hidden"
        aria-label="Toggle menu"
      >
        <div className="space-y-1.5">
          <span className={`block h-0.5 w-5 bg-indigo-600 transition-all duration-300 ${open ? 'translate-y-[4px] rotate-45' : ''}`} />
          <span className={`block h-0.5 w-5 bg-indigo-600 transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-5 bg-indigo-600 transition-all duration-300 ${open ? '-translate-y-[4px] -rotate-45' : ''}`} />
        </div>
      </button>

      {/* Mobile menu - Full screen overlay */}
      {open && (
        <div className="fixed inset-0 top-0 z-[100] lg:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          
          {/* Menu panel */}
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-[#1e1b4b] shadow-2xl">
            {/* Close button */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <span className="text-lg font-bold text-white">Menu</span>
              <button
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
              >
                ✕
              </button>
            </div>

            {/* Links */}
            <div className="flex flex-col gap-1 p-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-4 py-3.5 text-base font-semibold transition-all duration-200 ${
                    pathname === link.href
                      ? 'bg-indigo-600/30 text-yellow-400 border-l-4 border-yellow-400'
                      : 'text-gray-200 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="mt-4 rounded-lg bg-yellow-400 px-4 py-3.5 text-center text-base font-bold text-gray-900 shadow-lg transition-all hover:bg-yellow-300"
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
