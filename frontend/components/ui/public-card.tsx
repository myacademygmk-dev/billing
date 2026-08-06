import type { ReactNode } from 'react';

type CardTone = 'light' | 'dark';

const TONE_CLASSES: Record<CardTone, string> = {
  light: 'bg-white border border-slate-200',
  dark: 'bg-white/[0.03] border border-white/10',
};

const TONE_HOVER: Record<CardTone, string> = {
  light: 'hover:border-slate-300 hover:shadow-md',
  dark: 'hover:border-white/20 hover:bg-white/[0.05]',
};

/**
 * Shared card shell for every public page — Swiss/institutional style:
 * flat surface, one hairline border, a near-invisible resting shadow that
 * only deepens slightly on hover. No gradients, no lift/scale, no
 * decorative accent bars — hierarchy comes from content, not chrome.
 */
export function Card({
  children,
  tone = 'light',
  interactive = true,
  className = '',
}: {
  children: ReactNode;
  tone?: CardTone;
  interactive?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`group relative rounded-xl ${TONE_CLASSES[tone]} shadow-sm transition-all duration-200 ${
        interactive ? TONE_HOVER[tone] : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

type BadgeTone = 'neutral' | 'accent' | 'gold' | 'dark';

const BADGE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  accent: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  gold: 'bg-amber-50 text-amber-800 border-amber-200',
  dark: 'bg-white/10 text-slate-200 border-white/10',
};

/** Small uppercase label chip (class, year, batch, date). One flat tone — no rainbow. */
export function CardBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${BADGE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}

type RankTier = '1' | '2' | '3' | 'other';

export function rankTier(rank: unknown): RankTier {
  const r = String(rank ?? '').trim().toLowerCase();
  if (r === '1' || r === 'first' || r === '1st') return '1';
  if (r === '2' || r === 'second' || r === '2nd') return '2';
  if (r === '3' || r === 'third' || r === '3rd') return '3';
  return 'other';
}

/**
 * Award-tier palette: gold/silver/bronze used the way a certification badge
 * uses them — a deliberate, restrained signal on a clean surface — not
 * decoration. `other` covers non-numeric ranks (e.g. "Gold Medal", a sport).
 */
const TIER: Record<RankTier, { ribbon: string; chip: string; icon: string; glow: string; dot: string; label: (rank: unknown) => string }> = {
  '1': {
    ribbon: 'bg-amber-500',
    chip: 'bg-amber-50',
    icon: 'text-amber-600',
    glow: 'shadow-[0_0_0_4px_rgba(245,158,11,0.16)]',
    dot: '#f59e0b',
    label: () => '1st Place',
  },
  '2': {
    ribbon: 'bg-slate-400',
    chip: 'bg-slate-100',
    icon: 'text-slate-500',
    glow: 'shadow-[0_0_0_4px_rgba(148,163,184,0.2)]',
    dot: '#94a3b8',
    label: () => '2nd Place',
  },
  '3': {
    ribbon: 'bg-amber-700',
    chip: 'bg-amber-50',
    icon: 'text-amber-800',
    glow: 'shadow-[0_0_0_4px_rgba(180,83,9,0.16)]',
    dot: '#b45309',
    label: () => '3rd Place',
  },
  other: {
    ribbon: 'bg-indigo-600',
    chip: 'bg-indigo-50',
    icon: 'text-indigo-600',
    glow: 'shadow-[0_0_0_4px_rgba(79,70,229,0.14)]',
    dot: '#4f46e5',
    label: (rank) => String(rank ?? 'Honoree'),
  },
};

/** Hex color for the active tier — used by client components (progress rings, canvas, etc.). */
export function tierDotColor(rank: unknown): string {
  return TIER[rankTier(rank)].dot;
}

/**
 * Diagonal corner ribbon with a confetti-dot backdrop and a silk sheen —
 * the classic award/certificate motif, with a hint of texture and light
 * instead of a flat color block. Place inside a `relative` Card.
 */
export function RankRibbon({ rank }: { rank: unknown }) {
  if (!rank) return null;
  const t = TIER[rankTier(rank)];
  return (
    <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{ backgroundImage: `radial-gradient(${t.dot} 1px, transparent 1px)`, backgroundSize: '9px 9px' }}
      />
      <div className={`absolute right-[-30px] top-[14px] flex w-[120px] items-center justify-center gap-1 rotate-45 py-1 text-center text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${t.ribbon}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.563.563 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
        </svg>
        {t.label(rank)}
        {/* Silk sheen */}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/35 via-transparent to-black/10" />
      </div>
    </div>
  );
}

/** Tier-tinted shadow that blooms on card hover — pairs with `rankCardTint`. */
export function rankHoverGlow(rank: unknown): string {
  const glow: Record<RankTier, string> = {
    '1': 'hover:shadow-[0_10px_28px_-12px_rgba(245,158,11,0.45)]',
    '2': 'hover:shadow-[0_10px_28px_-12px_rgba(148,163,184,0.45)]',
    '3': 'hover:shadow-[0_10px_28px_-12px_rgba(180,83,9,0.4)]',
    other: 'hover:shadow-[0_10px_28px_-12px_rgba(79,70,229,0.35)]',
  };
  return glow[rankTier(rank)];
}

/** Circular medal with a tier-colored glow ring and a shine sweep on card hover. */
export function RankMedal({ rank, size = 'md' }: { rank: unknown; size?: 'sm' | 'md' }) {
  const t = TIER[rankTier(rank)];
  const dims = size === 'sm' ? 'h-9 w-9' : 'h-10 w-10';
  const iconDims = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  return (
    <div className={`relative flex ${dims} shrink-0 items-center justify-center overflow-hidden rounded-full ${t.chip} ${t.glow}`}>
      <svg xmlns="http://www.w3.org/2000/svg" className={`${iconDims} ${t.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .982-3.172M12 3.75a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
      </svg>
      {/* Shine sweep — plays once on card hover */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
    </div>
  );
}

/** Subtle warm spotlight wash for the #1 card — signals "featured" without gradients elsewhere. */
export function rankCardTint(rank: unknown): string {
  return rankTier(rank) === '1' ? 'bg-gradient-to-br from-amber-50/70 via-white to-white' : '';
}
