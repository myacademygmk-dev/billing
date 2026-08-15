'use client';

import { useEffect, useState } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: string): TimeLeft | null {
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

export function Countdown() {
  const [countdownDate, setCountdownDate] = useState<string | null>(null);
  const [countdownTitle, setCountdownTitle] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/backend/public/website-config');
        if (res.ok) {
          const data = await res.json();
          if (data.countdown_date) {
            setCountdownDate(data.countdown_date);
            setCountdownTitle(data.countdown_title || 'Coming Soon');
            setTimeLeft(calculateTimeLeft(data.countdown_date));
          }
        }
      } catch {}
      setLoaded(true);
    };
    fetchConfig();
  }, []);

  // Update every second
  useEffect(() => {
    if (!countdownDate) return;
    const timer = setInterval(() => {
      const tl = calculateTimeLeft(countdownDate);
      setTimeLeft(tl);
      if (!tl) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdownDate]);

  // Don't render if no countdown configured or time expired
  if (!loaded || !countdownDate || !timeLeft) return null;

  const blocks = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hours' },
    { value: timeLeft.minutes, label: 'Minutes' },
    { value: timeLeft.seconds, label: 'Seconds' },
  ];

  return (
    <section className="relative py-14 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="countdown-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#countdown-pattern)" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-300">⏳ Countdown</div>
        <h2 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl lg:text-4xl">{countdownTitle}</h2>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          {blocks.map((block) => (
            <div key={block.label} className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-4 sm:p-6">
              <div className="text-3xl font-bold text-white tabular-nums sm:text-4xl lg:text-5xl">
                {String(block.value).padStart(2, '0')}
              </div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-indigo-200 sm:text-sm">
                {block.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
