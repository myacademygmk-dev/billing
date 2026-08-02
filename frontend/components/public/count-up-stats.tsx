'use client';

import { useEffect, useRef, useState } from 'react';

interface StatCardProps {
  value: number;
  suffix?: string;
  label: string;
  icon: string;
  delay: number;
}

function StatCard({ value, suffix = '', label, icon, delay }: StatCardProps) {
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
            const duration = 2000;
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

  const displayValue = suffix === 'LKG-12'
    ? 'LKG-12'
    : `${count}${value > 0 && suffix ? suffix : ''}`;

  return (
    <div
      ref={ref}
      className="group relative rounded-2xl bg-gradient-to-b from-white to-[#f5f3ff] p-6 text-center shadow-lg shadow-indigo-500/10 border border-white/60 backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-indigo-500/15"
      style={{ transitionDelay: `${delay * 100}ms` }}
    >
      {/* Gradient top accent line: purple → yellow */}
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-purple-500 via-indigo-500 to-yellow-400" />

      {/* Icon with colored circle background */}
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-2xl shadow-sm ring-1 ring-indigo-200/50">
        {icon}
      </div>

      {/* Number — larger text */}
      <div className="text-4xl font-extrabold text-indigo-600 sm:text-5xl">
        {displayValue}
      </div>

      {/* Label */}
      <div className="mt-2 text-xs font-bold uppercase tracking-wider text-gray-500">
        {label}
      </div>
    </div>
  );
}

const STATS = [
  { value: 15, suffix: '+', label: 'Years', icon: '🏛️' },
  { value: 200, suffix: '+', label: 'Students', icon: '🎓' },
  { value: 22, suffix: '', label: 'Staff', icon: '👨‍🏫' },
  { value: 0, suffix: 'LKG-12', label: 'Standards', icon: '📚' },
];

export function CountUpStats() {
  return (
    <section className="relative -mt-14 z-10 pb-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
          {STATS.map((stat, i) => (
            <StatCard
              key={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              icon={stat.icon}
              delay={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
