'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface StatItemProps {
  value: number;
  suffix?: string;
  label: string;
  icon: ReactNode;
  delay: number;
  iconBg: string;
  accent: string;
}

function StatItem({ value, suffix = '', label, icon, delay, iconBg, accent }: StatItemProps) {
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
            const duration = 900;
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
      className="flex h-16 items-center gap-2.5 border-b border-slate-200 px-4 py-0 last:border-b-0 md:h-[72px] md:border-b-0 md:border-r md:last:border-r-0 [&:nth-child(odd)]:border-r [&:nth-child(-n+2)]:border-b [&:nth-child(n+3)]:border-b-0 md:[&:nth-child(odd)]:border-r-0 md:[&:nth-child(-n+2)]:border-b-0"
      style={{ transitionDelay: `${delay * 100}ms` }}
    >
      <div className={`flex size-[30px] shrink-0 items-center justify-center rounded-lg ${iconBg} ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[22px] font-semibold leading-none text-slate-950 tabular-nums">{displayValue}</div>
        <div className="mt-1 text-xs font-medium leading-[1.2] text-slate-500">{label}</div>
      </div>
    </div>
  );
}

const ICONS = {
  // Clock — years of operation
  years: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  // Graduation cap — students
  students: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
    </svg>
  ),
  // Person — teaching staff
  staff: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  ),
  // Open book — standards taught
  standards: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  ),
};

const STATS = [
  { value: 15, suffix: '+', label: 'Years of Excellence', icon: ICONS.years, iconBg: 'bg-indigo-50', accent: 'text-indigo-700' },
  { value: 200, suffix: '+', label: 'Students', icon: ICONS.students, iconBg: 'bg-emerald-50', accent: 'text-emerald-700' },
  { value: 22, suffix: '', label: 'Expert Educators', icon: ICONS.staff, iconBg: 'bg-amber-50', accent: 'text-amber-700' },
  { value: 0, suffix: 'LKG-12', label: 'Grade Levels', icon: ICONS.standards, iconBg: 'bg-rose-50', accent: 'text-rose-700' },
];

/**
 * A single "stats shelf" that overlaps the hero below it — the standard way
 * to visually anchor a stat bar to the section above instead of leaving it
 * floating alone in blank space. Collapses to individual chip cards on
 * mobile, becomes one bordered bar with dividers from sm+.
 */
export function CountUpStats() {
  return (
    <section className="relative z-10 -mt-5 px-0 sm:-mt-7">
      <div className="mx-auto h-[128px] w-[calc(100%-32px)] overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-sm md:h-[72px] md:w-[calc(100%-32px)] lg:w-[min(900px,calc(100%-48px))]">
        <div className="grid h-full grid-cols-2 md:grid-cols-4">
          {STATS.map((stat, i) => (
            <StatItem key={stat.label} value={stat.value} suffix={stat.suffix} label={stat.label} icon={stat.icon} delay={i} iconBg={stat.iconBg} accent={stat.accent} />
          ))}
        </div>
      </div>
    </section>
  );
}
