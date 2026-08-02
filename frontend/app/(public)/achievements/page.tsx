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
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] py-16 sm:py-20">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-indigo-200">
            <span>Home</span>
            <span>/</span>
            <span className="text-white font-medium">Achievements</span>
          </div>
          <h1 className="mt-4 text-4xl font-bold text-white sm:text-5xl">Achievements</h1>
          <p className="mt-3 text-lg text-indigo-100">Celebrating academic excellence of our students</p>
        </div>
      </section>

      {/* Achievements Grid */}
      <section className="bg-[#f5f3ff] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {achievements.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-md border border-indigo-100">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-gradient-to-br from-[#eab308] to-[#fbbf24]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#0f172a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .982-3.172M12 3.75a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
                </svg>
              </div>
              <p className="mt-4 text-lg font-semibold text-gray-900">No achievements to display yet</p>
              <p className="mt-2 text-sm text-gray-500">Achievements will be shown here once added.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((a: any) => (
                <div
                  key={a.id}
                  className="group relative overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5"
                >
                  {/* Gradient left border */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#4f46e5] to-[#7c3aed]" />

                  <div className="p-6 pl-7">
                    {/* Top row: Trophy + Name */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate">{a.student_name}</h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full bg-[#f5f3ff] border border-[#4f46e5]/20 px-2.5 py-0.5 text-xs font-semibold text-[#4f46e5]">
                            {a.class_name}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-[#f0fdfa] border border-[#0d9488]/20 px-2.5 py-0.5 text-xs font-semibold text-[#0d9488]">
                            {a.year}
                          </span>
                        </div>
                      </div>
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#eab308] to-[#fbbf24] shadow-md shadow-yellow-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#0f172a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .982-3.172M12 3.75a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
                        </svg>
                      </div>
                    </div>

                    {/* Rank & Marks */}
                    <div className="mt-5 flex flex-wrap gap-3">
                      {a.rank && (
                        <div className="rounded-xl bg-gradient-to-r from-[#eab308] to-[#fbbf24] px-4 py-2 text-center shadow-sm">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#0f172a]/70">Rank</p>
                          <p className="text-lg font-bold text-[#0f172a]">{a.rank}</p>
                        </div>
                      )}
                      {a.marks && (
                        <div className="rounded-xl bg-gradient-to-r from-[#f5f3ff] to-[#eef2ff] border border-[#4f46e5]/10 px-4 py-2 text-center">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#4f46e5]/70">Marks</p>
                          <p className="text-lg font-bold text-[#4f46e5]">{a.marks}</p>
                        </div>
                      )}
                    </div>
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
