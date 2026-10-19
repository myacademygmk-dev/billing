'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/components/ui/cn';

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
      { href: '/about#our-story', label: 'Our Story' },
      { href: '/about#mission-vision', label: 'Mission & Vision' },
      { href: '/about#management', label: 'Management' },
      { href: '/about#tech-support', label: 'Tech Support' },
      { href: '/about#faculty', label: 'Faculty' },
      { href: '/about#facilities', label: 'Facilities' },
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
      { href: '/timetable', label: 'Timetable' },
      { href: '/publications', label: 'Publications' },
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
  const target = href.split('#')[0] || '/';
  if (target === '/') return pathname === '/';
  return pathname === target || pathname.startsWith(target + '/');
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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on route change
  useEffect(() => {
    setActiveDropdown(null);
    setOpen(false);
    setMobileExpanded(null);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const trigger = menuButtonRef.current;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      const firstFocusable = mobileMenuRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        trigger?.focus();
        return;
      }
      if (event.key !== 'Tab' || !mobileMenuRef.current) return;
      const focusable = Array.from(
        mobileMenuRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      trigger?.focus();
    };
  }, [open]);

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
      <nav aria-label="Primary navigation" className="hidden h-16 items-center gap-1 xl:flex">
        {NAV_LINKS.map((item) => (
          <div
            key={item.label}
            className="relative"
            onMouseEnter={() => item.children && handleMouseEnter(item.label)}
            onMouseLeave={() => item.children && handleMouseLeave()}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setActiveDropdown(null);
                (event.currentTarget.querySelector('button, a') as HTMLElement | null)?.focus();
              }
            }}
          >
            {item.children ? (
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={activeDropdown === item.label}
                aria-controls={`desktop-menu-${item.label.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
                className={cn(
                  'relative flex h-16 items-center gap-1 px-3 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30',
                  isDropdownActive(pathname, item) && 'font-semibold text-slate-950',
                )}
              >
                {item.label}
                <svg
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${activeDropdown === item.label ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                {isDropdownActive(pathname, item) && (
                  <span className="absolute inset-x-3 bottom-2 h-0.5 bg-black" />
                )}
              </button>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  'relative flex h-16 items-center gap-1 px-3 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30',
                  isDropdownActive(pathname, item) && 'font-semibold text-slate-950',
                )}
              >
                {item.label}
                {isDropdownActive(pathname, item) && (
                  <span className="absolute inset-x-3 bottom-2 h-0.5 bg-black" />
                )}
              </Link>
            )}

            {/* Dropdown panel */}
            {item.children && activeDropdown === item.label && (
              <div className="absolute left-0 top-full z-50 pt-2">
                <div id={`desktop-menu-${item.label.replace(/\s+/g, '-').toLowerCase()}`} role="menu" className="min-w-[220px] border border-slate-200 bg-white p-2 shadow-md">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      role="menuitem"
                      className={`flex items-center px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
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
        ref={menuButtonRef}
        onClick={() => setOpen(!open)}
        className="flex size-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition-colors hover:bg-slate-50 xl:hidden"
        aria-label="Toggle menu"
        aria-expanded={open}
        aria-controls="public-mobile-menu"
      >
        <div className="space-y-1.5">
          <span className={`block h-0.5 w-5 bg-current transition-transform duration-150 ${open ? 'translate-y-[4px] rotate-45' : ''}`} />
          <span className={`block h-0.5 w-5 bg-current transition-opacity duration-150 ${open ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-5 bg-current transition-transform duration-150 ${open ? '-translate-y-[4px] -rotate-45' : ''}`} />
        </div>
      </button>

      {/* Mobile menu - Full screen overlay */}
      {open && (
        <div id="public-mobile-menu" className="fixed inset-0 top-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Website navigation">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-950/40" onClick={() => setOpen(false)} />
          
          {/* Menu panel */}
          <div ref={mobileMenuRef} className="absolute right-0 top-0 h-dvh w-full max-w-sm overflow-y-auto border-l border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] shadow-lg">
            {/* Close button */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <span className="text-lg font-bold text-slate-900">Menu</span>
              <button
                onClick={() => setOpen(false)}
                className="flex size-9 items-center justify-center rounded-md border border-slate-300 text-slate-700 transition-colors hover:bg-slate-50"
                aria-label="Close menu"
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
                        className={`flex w-full items-center justify-between rounded-md border-l-2 px-4 py-3 text-base font-semibold transition-colors ${
                          isDropdownActive(pathname, item)
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-transparent text-slate-700 hover:bg-slate-50 hover:text-indigo-700'
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
                        <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-slate-200 pl-3">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setOpen(false)}
                              className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                                isActive(pathname, child.href)
                                  ? 'bg-indigo-50 text-indigo-700'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-700'
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
                      className={`block rounded-md border-l-2 px-4 py-3 text-base font-semibold transition-colors ${
                        isActive(pathname, item.href)
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-transparent text-slate-700 hover:bg-slate-50 hover:text-indigo-700'
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
                className="mt-4 rounded-md bg-indigo-600 px-4 py-3 text-center text-base font-bold text-white transition-colors hover:bg-indigo-700"
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
