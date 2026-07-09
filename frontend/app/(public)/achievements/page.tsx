export const dynamic = 'force-dynamic';

async function getData() {
  const base = process.env.BACKEND_API_BASE_URL ?? 'http://localhost:8000/api';
  try {
    const res = await fetch(`${base}/public/achievements?limit=50`, { signal: AbortSignal.timeout(3000), next: { revalidate: 60 } } as any);
    return res.ok ? await res.json() : [];
  } catch { return []; }
}

export default async function AchievementsPage() {
  const achievements = await getData();

  return (
    <div>
      <section className="bg-gray-900 py-14 text-white sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-yellow-400">Excellence</div>
          <h1 className="mt-3 text-3xl font-bold sm:text-5xl">Achievements</h1>
          <p className="mt-3 text-sm text-gray-400 sm:text-base">Celebrating academic excellence of our students</p>
        </div>
      </section>

      <section className="relative py-14 overflow-hidden sm:py-16">
        <div className="absolute top-20 right-10 h-40 w-40 rounded-full bg-yellow-200/30 blur-[60px]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          {achievements.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm sm:p-12">
              <p className="text-sm text-gray-500">No achievements to display yet.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {achievements.map((a: any, i: number) => (
                <div key={a.id} className={`reveal reveal-delay-${(i % 3) + 1} group rounded-2xl bg-white p-5 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 sm:p-6`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-bold text-gray-900 sm:text-base">{a.student_name}</div>
                      <div className="mt-0.5 text-[11px] text-gray-500 sm:text-xs">{a.class_name} • {a.year}</div>
                    </div>
                    <span className="text-lg opacity-40 group-hover:opacity-100 transition-opacity duration-300 sm:text-xl">🏆</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
                    {a.rank && <span className="rounded-lg bg-yellow-50 border border-yellow-200 px-2 py-0.5 text-[10px] font-bold text-yellow-700 sm:px-2.5 sm:py-1 sm:text-[11px]">Rank {a.rank}</span>}
                    {a.marks && <span className="rounded-lg bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700 sm:px-2.5 sm:py-1 sm:text-[11px]">{a.marks}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
