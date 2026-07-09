export const dynamic = 'force-dynamic';

async function getData() {
  const base = process.env.BACKEND_API_BASE_URL ?? 'http://localhost:8000/api';
  try {
    const [newsRes, eventsRes] = await Promise.all([
      fetch(`${base}/public/news?limit=20`, { signal: AbortSignal.timeout(3000), next: { revalidate: 60 } } as any),
      fetch(`${base}/public/events?limit=20`, { signal: AbortSignal.timeout(3000), next: { revalidate: 60 } } as any),
    ]);
    return { news: newsRes.ok ? await newsRes.json() : [], events: eventsRes.ok ? await eventsRes.json() : [] };
  } catch { return { news: [], events: [] }; }
}

export default async function NewsPage() {
  const { news, events } = await getData();

  return (
    <div>
      <section className="bg-gray-900 py-14 text-white sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-400">Updates</div>
          <h1 className="mt-3 text-3xl font-bold sm:text-5xl">News & Events</h1>
          <p className="mt-3 text-sm text-gray-400 sm:text-base">Stay updated with MY Academy</p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {events.length > 0 && (
            <div className="mb-10 sm:mb-14">
              <h2 className="reveal text-lg font-bold text-gray-900 sm:text-xl">Upcoming Events</h2>
              <div className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {events.map((event: any, i: number) => (
                  <div key={event.id} className={`reveal reveal-delay-${(i % 3) + 1} rounded-2xl bg-white p-5 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 sm:p-6`}>
                    {event.date && <div className="text-[11px] font-bold text-blue-600 sm:text-xs">{new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
                    <h3 className="mt-2 text-sm font-semibold text-gray-900 sm:text-base">{event.title}</h3>
                    {event.description && <p className="mt-2 text-xs text-gray-500 line-clamp-3 sm:text-sm">{event.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {news.length > 0 && (
            <div>
              <h2 className="reveal text-lg font-bold text-gray-900 sm:text-xl">Latest News</h2>
              <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
                {news.map((item: any, i: number) => (
                  <div key={item.id} className={`reveal reveal-delay-${(i % 3) + 1} rounded-2xl bg-white p-4 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md sm:p-5`}>
                    <div className="text-[11px] text-gray-400 sm:text-xs">{item.date}</div>
                    <h3 className="mt-1 text-sm font-semibold text-gray-900 sm:text-base">{item.title}</h3>
                    {item.description && <p className="mt-1 text-xs text-gray-500 line-clamp-2 sm:mt-2 sm:text-sm">{item.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {news.length === 0 && events.length === 0 && (
            <div className="reveal rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm sm:p-12">
              <p className="text-sm text-gray-500">No news or events yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
