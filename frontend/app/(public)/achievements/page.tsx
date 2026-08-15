'use client';

import { useEffect, useState } from 'react';
import { Card, CardBadge, RankRibbon, rankTier, rankCardTint, rankHoverGlow } from '@/components/ui/public-card';
import { AchievementMedal } from '@/components/ui/achievement-medal';
import { GlowOrb } from '@/components/ui/glow-orb';

interface Achievement {
  id: number;
  student_name: string;
  class_name?: string;
  year?: string;
  rank?: number;
  marks?: string;
}

interface CategorizedAchievements {
  toppers: Achievement[];
  centum: Achievement[];
  bestStudents: Achievement[];
  other: Achievement[];
}

function categorize(achievements: Achievement[]): CategorizedAchievements {
  const toppers: Achievement[] = [];
  const centum: Achievement[] = [];
  const bestStudents: Achievement[] = [];
  const other: Achievement[] = [];

  for (const a of achievements) {
    if (a.rank && a.rank >= 1 && a.rank <= 3) {
      toppers.push(a);
    } else if (a.marks && (a.marks.includes('100') || a.marks.toLowerCase().includes('centum'))) {
      centum.push(a);
    } else if (a.rank && a.rank <= 10) {
      bestStudents.push(a);
    } else {
      other.push(a);
    }
  }

  return { toppers, centum, bestStudents, other };
}

function groupByYear(achievements: Achievement[]): Map<string, Achievement[]> {
  const map = new Map<string, Achievement[]>();
  for (const a of achievements) {
    const year = a.year || 'Other';
    if (!map.has(year)) map.set(year, []);
    map.get(year)!.push(a);
  }
  // Sort by year descending
  const sorted = new Map(
    [...map.entries()].sort((a, b) => {
      if (a[0] === 'Other') return 1;
      if (b[0] === 'Other') return -1;
      return b[0].localeCompare(a[0]);
    })
  );
  return sorted;
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/backend';
        const res = await fetch(`${base}/public/achievements?limit=50`);
        if (res.ok) {
          const data = await res.json();
          setAchievements(data);
          // Expand the most recent year by default
          const grouped = groupByYear(data);
          const firstYear = grouped.keys().next().value;
          if (firstYear) setExpandedYears(new Set([firstYear]));
        }
      } catch {
        // empty
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const grouped = groupByYear(achievements);

  function toggleYear(year: string) {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] py-8 sm:py-10">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-indigo-200">
            <span>Home</span>
            <span>/</span>
            <span className="text-white font-medium">Achievements</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Achievements</h1>
          <p className="mt-3 text-lg text-indigo-100">Celebrating academic excellence of our students</p>
        </div>
      </section>

      {/* Achievements by Year */}
      <section className="relative overflow-hidden bg-slate-50 py-12 sm:py-14">
        <GlowOrb color="bg-amber-200/40" className="-left-20 -top-20 h-72 w-72" />
        <GlowOrb color="bg-indigo-200/30" className="-bottom-16 -right-16 h-64 w-64" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-6">
                  <div className="h-6 w-32 rounded bg-slate-200" />
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="h-24 rounded bg-slate-100" />
                    <div className="h-24 rounded bg-slate-100" />
                    <div className="h-24 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : achievements.length === 0 ? (
            <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-slate-200">
              <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-lg bg-slate-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .982-3.172M12 3.75a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
                </svg>
              </div>
              <p className="mt-4 text-lg font-semibold text-slate-900">No achievements to display yet</p>
              <p className="mt-2 text-sm text-slate-500">Achievements will be shown here once added.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {[...grouped.entries()].map(([year, items]) => {
                const isExpanded = expandedYears.has(year);
                const categories = categorize(items);

                return (
                  <div key={year} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    {/* Year Header - clickable */}
                    <button
                      onClick={() => toggleYear(year)}
                      className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .982-3.172M12 3.75a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{year}</h3>
                          <p className="text-xs text-slate-500">{items.length} achievement{items.length > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>

                    {/* Expandable Content */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 px-6 py-5 space-y-6">
                        {/* Year Toppers */}
                        {categories.toppers.length > 0 && (
                          <CategorySection title="🏆 Year Toppers" achievements={categories.toppers} />
                        )}

                        {/* Centum Students */}
                        {categories.centum.length > 0 && (
                          <CategorySection title="💯 Centum Students" achievements={categories.centum} />
                        )}

                        {/* Best Students */}
                        {categories.bestStudents.length > 0 && (
                          <CategorySection title="⭐ Best Students" achievements={categories.bestStudents} />
                        )}

                        {/* Other */}
                        {categories.other.length > 0 && (
                          <CategorySection title="🎓 Other Achievements" achievements={categories.other} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function CategorySection({ title, achievements }: { title: string; achievements: Achievement[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-700 mb-3">{title}</h4>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a, i) => {
          const isWinner = rankTier(a.rank) === '1';
          return (
            <Card
              key={a.id}
              className={`overflow-hidden transition-transform hover:-translate-y-0.5 ${rankCardTint(a.rank)} ${rankHoverGlow(a.rank)} ${isWinner ? 'ring-1 ring-amber-200' : ''}`}
            >
              <RankRibbon rank={a.rank} />
              <div className="flex items-start gap-3 p-4 pb-3">
                <AchievementMedal rank={a.rank} marks={a.marks} size="sm" />
                <div className="min-w-0 pt-0.5">
                  <h3 className="text-[15px] font-semibold text-slate-900 leading-tight truncate pr-6">{a.student_name}</h3>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {a.class_name && <CardBadge tone="accent">{a.class_name}</CardBadge>}
                    {a.year && <CardBadge tone="neutral">{a.year}</CardBadge>}
                  </div>
                </div>
              </div>
              {a.marks && (
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Marks Obtained</p>
                  <p className={`text-sm font-bold tabular-nums ${isWinner ? 'text-amber-600' : 'text-slate-900'}`}>{a.marks}</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
