'use client';
import { useEffect, useState } from 'react';
import { useWebsiteConfig } from './website-config-context';
export function Countdown() {
  const config = useWebsiteConfig();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const configured = config.countdowns ?? (config.countdown_date ? [{ title: config.countdown_title || 'Coming Soon', date: config.countdown_date }] : []);
  const active = configured.filter((item) => now !== null && new Date(item.date).getTime() > now).slice(0, 4);
  if (!active.length || now === null) return null;
  return <section aria-label="Upcoming events" className="bg-slate-950 py-10 sm:py-14">
    <div className={`mx-auto grid max-w-6xl gap-5 px-4 sm:px-6 ${active.length > 1 ? 'md:grid-cols-2' : ''}`}>
      {active.map((item, index) => {
        const remaining = Math.max(0, Math.floor((new Date(item.date).getTime() - now) / 1000));
        const parts = [Math.floor(remaining / 86400), Math.floor(remaining / 3600) % 24, Math.floor(remaining / 60) % 60, remaining % 60];
        return <article key={`${item.title}-${item.date}-${index}`} className="min-w-0 rounded-2xl border border-indigo-400/25 bg-indigo-950 p-5 text-center sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">Coming up</p>
          <h2 className="mt-2 break-words text-xl font-bold text-white sm:text-2xl">{item.title}</h2>
          <time dateTime={item.date} className="mt-2 block text-sm text-indigo-200">{new Date(item.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</time>
          <div className="mt-5 grid grid-cols-4 gap-2 sm:gap-3">
            {['Days', 'Hours', 'Minutes', 'Seconds'].map((label, i) => <div key={label} className="min-w-0 rounded-lg bg-white/10 px-1 py-4">
              <div className="text-2xl font-bold tabular-nums text-white sm:text-3xl">{String(parts[i]).padStart(2, '0')}</div>
              <div className="mt-1 text-[10px] text-indigo-200 sm:text-xs">{label}</div>
            </div>)}
          </div>
        </article>;
      })}
    </div>
  </section>;
}
