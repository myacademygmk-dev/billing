'use client';
import { Card } from '@/components/ui/public-card';
import { useWebsiteConfig } from '@/components/public/website-config-context';
import { DEFAULT_FACILITIES } from '@/lib/website-defaults';

const HIGHLIGHTS = [
  'Focused classroom environment for every batch',
  'Regular tests and feedback for steady improvement',
  'Safe learning space with monitored premises',
  'Learning support for academics, music, and skill classes',
];

export function FacilitiesSection() {
  const { facilities } = useWebsiteConfig();
  const entries = facilities ?? DEFAULT_FACILITIES;
  if (!entries.length) return null;
  return (
    <section id="facilities" className="relative scroll-mt-24 overflow-hidden bg-[#0f172a] py-12 sm:py-14">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-400">Facilities</p>
          <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Campus & Learning Support</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">
            Infrastructure and student support systems that keep learning disciplined, safe, and consistent.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {entries.map((raw, index) => {
            const facility: { name?: string; title?: string; description?: string; photo_url?: string; image?: string } = typeof raw === 'string' ? { name: raw } : raw;
            return (
            <Card key={index} tone="dark" className="hover:border-teal-400/40">
              {(facility.photo_url || facility.image) && <img src={facility.photo_url || facility.image} alt={facility.name || facility.title || 'Facility'} className="h-40 w-full bg-slate-900 object-contain" />}
              <div className="flex items-center gap-3 px-4 py-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-teal-400/10 text-teal-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div><span className="text-sm font-semibold text-slate-200">{facility.name || facility.title}</span>
                  {facility.description && <p className="mt-1 text-xs text-slate-400">{facility.description}</p>}
                </div>
              </div>
            </Card>
          ); })}
        </div>

        {facilities == null && <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {HIGHLIGHTS.map((highlight) => (
            <div key={highlight} className="rounded-md border border-white/10 bg-white/[0.04] p-4 text-sm font-medium text-slate-300">
              {highlight}
            </div>
          ))}
        </div>}
      </div>
    </section>
  );
}
