'use client';

import { useEffect, useRef, useState } from 'react';

interface CounterProps {
  target: number;
  suffix?: string;
  duration?: number;
}

function Counter({ target, suffix = '+', duration = 2000 }: CounterProps) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            animateCount();
          }
        });
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  const animateCount = () => {
    const startTime = performance.now();
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };
    requestAnimationFrame(step);
  };

  return (
    <div ref={ref} className="counter-animate">
      <span className="text-4xl font-extrabold text-white sm:text-5xl">
        {count.toLocaleString()}
        <span className="text-yellow-400">{suffix}</span>
      </span>
    </div>
  );
}

const STATS = [
  { target: 2500, suffix: '+', label: 'Students Enrolled', icon: '🎓' },
  { target: 150, suffix: '+', label: 'Expert Faculty', icon: '👨‍🏫' },
  { target: 65, suffix: '+', label: 'Years of Excellence', icon: '🏛️' },
  { target: 500, suffix: '+', label: 'Achievements', icon: '🏆' },
];

export function AnimatedCounters() {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#4f46e5] via-[#4338ca] to-[#1e1b4b]" />
      
      {/* Geometric pattern overlay */}
      <div className="absolute inset-0 opacity-[0.04]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="counter-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#counter-grid)" />
        </svg>
      </div>

      {/* Geometric decorations */}
      <div className="absolute top-10 right-16 h-24 w-24 rotate-45 border border-white/10 hidden lg:block" />
      <div className="absolute bottom-10 left-16 h-16 w-16 rotate-12 border border-yellow-400/20 hidden lg:block" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">Our Strength</div>
          <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">Numbers That Speak</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="group relative rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 text-center transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 hover:shadow-2xl hover:border-yellow-400/30"
            >
              {/* Top accent line */}
              <div className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="text-3xl mb-3">{stat.icon}</div>
              <Counter target={stat.target} suffix={stat.suffix} />
              <div className="mt-2 text-sm font-semibold text-indigo-200 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
