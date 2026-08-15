'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  children?: { href: string; label: string }[];
}

const NAV_LINKS: NavItem[] = [
  { href: '/', label: 'Home' },
  {
    href: '/about',
    label: 'About Us',
    children: [
      { href: '/about', label: 'History' },
      { href: '/faculty', label: 'Faculty' },
      { href: '/facilities', label: 'Facilities' },
      { href: '/about#management-team', label: 'Management Team' },
      { href: '/about#technical-team', label: 'Technical Team' },
    ],
  },
  {
    href: '/student-corner',
    label: 'Student Corner',
    children: [
      { href: '/news', label: 'News & Events' },
      { href: '/student-corner/creativity', label: 'Student Creativity' },
      { href: '/student-corner/question-papers', label: 'Question Papers' },
      { href: '/student-corner/results', label: 'Results' },
    ],
  },
  { href: '/classes', label: 'Classes' },
  { href: '/achievements', label: 'Achievements' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/alumni', label: 'Alumni' },
  { href: '/admissions', label: 'Admissions' },
  { href: '/contact', label: 'Contact' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

function isDropdownActive(pathname: string, item: NavItem): boolean {
  if (!item.children) return isActive(pathname, item.href);
  return item.children.some((child) => isActive(pathname, child.href));
}

export function PublicNav() {
  const [open, setOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on route change
  useEffect(() => {
    setActiveDropdown(null);
    setOpen(false);
    setMobileExpanded(null);
  }, [pathname]);

  const handleMouseEnter = (label: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(label);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden items-center gap-0.5 lg:flex">
        {NAV_LINKS.map((item) => (
          <div
            key={item.label}
            className="relative"
            onMouseEnter={() => item.children && handleMouseEnter(item.label)}
            onMouseLeave={() => item.children && handleMouseLeave()}
          >
            <Link
              href={item.href}
              className={`relative flex items-center gap-1 px-3 py-2 text-sm font-semibold transition-colors duration-200 hover:text-indigo-600 ${
                isDropdownActive(pathname, item)
                  ? 'text-indigo-600'
                  : 'text-gray-700'
              }`}
            >
              {item.label}
              {item.children && (
                <svg
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${activeDropdown === item.label ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}
              {/* Active indicator */}
              {isDropdownActive(pathname, item) && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-yellow-400" />
              )}
            </Link>

            {/* Dropdown panel */}
            {item.children && activeDropdown === item.label && (
              <div className="absolute left-0 top-full z-50 pt-1">
                <div className="min-w-[200px] rounded-xl border border-slate-200 bg-white p-2 shadow-lg shadow-indigo-100/50">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                        isActive(pathname, child.href)
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-600 hover:bg-slate-50 hover:text-indigo-600'
                      }`}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
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
          <div className="absolute right-0 top-0 h-full w-full max-w-sm overflow-y-auto bg-[#1e1b4b] shadow-2xl">
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
              {NAV_LINKS.map((item) => (
                <div key={item.label}>
                  {item.children ? (
                    <>
                      {/* Parent with dropdown */}
                      <button
                        onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}
                        className={`flex w-full items-center justify-between rounded-lg px-4 py-3.5 text-base font-semibold transition-all duration-200 ${
                          isDropdownActive(pathname, item)
                            ? 'bg-indigo-600/30 text-yellow-400 border-l-4 border-yellow-400'
                            : 'text-gray-200 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {item.label}
                        <svg
                          className={`h-4 w-4 transition-transform duration-200 ${mobileExpanded === item.label ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {/* Dropdown items */}
                      {mobileExpanded === item.label && (
                        <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l-2 border-indigo-500/30 pl-3">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setOpen(false)}
                              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                                isActive(pathname, child.href)
                                  ? 'bg-indigo-600/20 text-yellow-400'
                                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`rounded-lg px-4 py-3.5 text-base font-semibold transition-all duration-200 ${
                        isActive(pathname, item.href)
                          ? 'bg-indigo-600/30 text-yellow-400 border-l-4 border-yellow-400'
                          : 'text-gray-200 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
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
