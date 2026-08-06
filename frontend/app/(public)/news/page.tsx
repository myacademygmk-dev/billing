import { Card } from '@/components/ui/public-card';
import { GlowOrb } from '@/components/ui/glow-orb';

export const revalidate = 60;

async function getData() {
  const base = process.env.BACKEND_API_BASE_URL ?? 'http://localhost:8000/api';
  try {
    const [newsRes, eventsRes] = await Promise.all([
      fetch(`${base}/public/news?limit=20`, { signal: AbortSignal.timeout(3000), next: { revalidate: 60 } } as any),
      fetch(`${base}/public/events?limit=20`, { signal: AbortSignal.timeout(3000), next: { revalidate: 60 } } as any),
    ]);
    return {
      news: newsRes.ok ? await newsRes.json() : [],
      events: eventsRes.ok ? await eventsRes.json() : [],
    };
  } catch { return { news: [], events: [] }; }
}

export default async function NewsPage() {
  const { news, events } = await getData();

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] py-8 sm:py-10">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-indigo-200">
            <span>Home</span>
            <span>/</span>
            <span className="text-white font-medium">News & Events</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">News & Events</h1>
          <p className="mt-3 text-lg text-indigo-100">Stay updated with MY Academy</p>
        </div>
      </section>

      {/* Content */}
      <section className="relative overflow-hidden bg-[#f5f3ff] py-12 sm:py-14">
        <GlowOrb color="bg-violet-200/40" className="-left-20 -top-20 h-72 w-72" />
        <GlowOrb color="bg-indigo-200/30" className="-bottom-16 -right-16 h-64 w-64" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          {/* Events */}
          {events.length > 0 && (
            <div className="mb-14">
              <h2 className="reveal text-2xl font-bold sm:text-3xl">
                <span className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] bg-clip-text text-transparent">Upcoming Events</span>
              </h2>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((event: any, i: number) => (
                  <Card key={event.id} className={`reveal reveal-delay-${(i % 6) + 1}`}>
                    <div className="p-6">
                      {event.date && (
                        <div className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      )}
                      <h3 className="mt-3 text-base font-semibold text-slate-900 sm:text-lg">{event.title}</h3>
                      {event.description && <p className="mt-2 text-sm text-slate-500 line-clamp-3">{event.description}</p>}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* News */}
          {news.length > 0 && (
            <div>
              <h2 className="reveal text-2xl font-bold sm:text-3xl">
                <span className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] bg-clip-text text-transparent">Latest News</span>
              </h2>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {news.map((item: any, i: number) => (
                  <Card key={item.id} className={`reveal reveal-delay-${(i % 6) + 1}`}>
                    <div className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6V7.5Z" />
                          </svg>
                        </div>
                        {item.date && (
                          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{item.date}</span>
                        )}
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-slate-900 sm:text-lg">{item.title}</h3>
                      {item.description && <p className="mt-2 text-sm text-slate-500 line-clamp-3">{item.description}</p>}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {news.length === 0 && events.length === 0 && (
            <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-slate-200">
              <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-lg bg-slate-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6V7.5Z" />
                </svg>
              </div>
              <p className="mt-4 text-lg font-semibold text-slate-900">No news or events yet</p>
              <p className="mt-2 text-sm text-slate-500">Check back soon for updates.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
