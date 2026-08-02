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
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] py-16 sm:py-20">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-indigo-200">
            <span>Home</span>
            <span>/</span>
            <span className="text-white font-medium">News & Events</span>
          </div>
          <h1 className="mt-4 text-4xl font-bold text-white sm:text-5xl">News & Events</h1>
          <p className="mt-3 text-lg text-indigo-100">Stay updated with MY Academy</p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-[#f5f3ff] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Events */}
          {events.length > 0 && (
            <div className="mb-14">
              <h2 className="text-2xl font-bold sm:text-3xl">
                <span className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] bg-clip-text text-transparent">Upcoming Events</span>
              </h2>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((event: any) => (
                  <div key={event.id} className="group rounded-2xl bg-white p-6 shadow-md border border-indigo-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    {event.date && (
                      <div className="inline-flex items-center rounded-full bg-[#eab308] px-3 py-1 text-xs font-bold text-[#0f172a]">
                        {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                    <h3 className="mt-3 text-base font-bold text-gray-900 sm:text-lg">{event.title}</h3>
                    {event.description && <p className="mt-2 text-sm text-gray-600 line-clamp-3">{event.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* News */}
          {news.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">
                <span className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] bg-clip-text text-transparent">Latest News</span>
              </h2>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {news.map((item: any) => (
                  <div key={item.id} className="group rounded-2xl bg-white p-6 shadow-md border border-indigo-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#4f46e5]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6V7.5Z" />
                        </svg>
                      </div>
                      {item.date && (
                        <span className="rounded-full bg-[#fefce8] border border-[#eab308]/30 px-3 py-1 text-xs font-semibold text-[#92400e]">{item.date}</span>
                      )}
                    </div>
                    <h3 className="mt-4 text-base font-bold text-gray-900 sm:text-lg">{item.title}</h3>
                    {item.description && <p className="mt-2 text-sm text-gray-600 line-clamp-3">{item.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {news.length === 0 && events.length === 0 && (
            <div className="rounded-2xl bg-white p-12 text-center shadow-md border border-indigo-100">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#4f46e5]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6V7.5Z" />
                </svg>
              </div>
              <p className="mt-4 text-lg font-semibold text-gray-900">No news or events yet</p>
              <p className="mt-2 text-sm text-gray-500">Check back soon for updates.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
