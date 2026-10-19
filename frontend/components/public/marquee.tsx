'use client';

import { useWebsiteConfig } from '@/components/public/website-config-context';

export function Marquee() {
  const { announcements = [] } = useWebsiteConfig();

  if (announcements.length === 0) return null;

  const text = announcements.join('\u00A0\u00A0\u00A0 | \u00A0\u00A0\u00A0');

  return (
    <div className="overflow-hidden border-b border-amber-200/70 bg-[#fff7d6] shadow-sm">
      <div className="mx-auto flex min-h-10 max-w-none items-stretch overflow-hidden px-0">
      {/* Static label */}
      <div className="flex shrink-0 items-center border-r border-amber-300 bg-amber-400 px-3 sm:px-5">
        <span className="whitespace-nowrap text-xs font-extrabold uppercase tracking-wide text-slate-950 sm:text-sm">Latest News</span>
      </div>
      {/* Scrolling text */}
      <div className="min-w-0 flex-1 overflow-hidden bg-[#1e1b4b]">
          <div className="animate-marquee whitespace-nowrap py-2">
          <span className="px-5 text-sm font-semibold text-amber-200">{text}</span>
        </div>
      </div>
      </div>
    </div>
  );
}
