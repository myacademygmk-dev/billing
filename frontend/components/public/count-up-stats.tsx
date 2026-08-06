'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface StatItemProps {
  value: number;
  suffix?: string;
  label: string;
  icon: ReactNode;
  delay: number;
}

function StatItem({ value, suffix = '', label, icon, delay }: StatItemProps) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            const startTime = performance.now();
            const duration = 1400;
            const step = (currentTime: number) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              setCount(Math.floor(eased * value));
              if (progress < 1) {
                requestAnimationFrame(step);
              } else {
                setCount(value);
              }
            };
            requestAnimationFrame(step);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, [hasAnimated, value]);

  const displayValue = suffix === 'LKG-12' ? 'LKG-12' : `${count}${value > 0 && suffix ? suffix : ''}`;

  return (
    <div
      ref={ref}
      className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:gap-3 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-5 sm:shadow-none"
      style={{ transitionDelay: `${delay * 100}ms` }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        {icon}
      </div>
      <div className="text-center sm:text-left">
        <div className="text-2xl font-bold text-slate-900 tabular-nums sm:text-[26px]">{displayValue}</div>
        <div className="mt-0.5 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      </div>
    </div>
  );
}

const ICONS = {
  // Clock — years of operation
  years: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  // Graduation cap — students
  students: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
    </svg>
  ),
  // Person — teaching staff
  staff: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  ),
  // Open book — standards taught
  standards: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  ),
};

const STATS = [
  { value: 15, suffix: '+', label: 'Years', icon: ICONS.years },
  { value: 200, suffix: '+', label: 'Students', icon: ICONS.students },
  { value: 22, suffix: '', label: 'Staff', icon: ICONS.staff },
  { value: 0, suffix: 'LKG-12', label: 'Standards', icon: ICONS.standards },
];

/**
 * A single "stats shelf" that overlaps the hero below it — the standard way
 * to visually anchor a stat bar to the section above instead of leaving it
 * floating alone in blank space. Collapses to individual chip cards on
 * mobile, becomes one bordered bar with dividers from sm+.
 */
export function CountUpStats() {
  return (
    <section className="relative z-10 -mt-10 px-4 sm:-mt-14 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-slate-100 sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-white sm:shadow-lg">
          {STATS.map((stat, i) => (
            <StatItem key={stat.label} value={stat.value} suffix={stat.suffix} label={stat.label} icon={stat.icon} delay={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
