export const dynamic = 'force-dynamic';

async function getData() {
  const base = process.env.BACKEND_API_BASE_URL ?? 'http://localhost:8000/api';
  try {
    const res = await fetch(`${base}/public/gallery?limit=20`, { signal: AbortSignal.timeout(3000), next: { revalidate: 60 } } as any);
    return res.ok ? await res.json() : [];
  } catch { return []; }
}

export default async function GalleryPage() {
  const albums = await getData();

  return (
    <div>
      <section className="bg-gray-900 py-14 text-white sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-purple-400">Memories</div>
          <h1 className="mt-3 text-3xl font-bold sm:text-5xl">Gallery</h1>
          <p className="mt-3 text-sm text-gray-400 sm:text-base">Moments from our events and activities</p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {albums.length === 0 ? (
            <div className="reveal rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm sm:p-12">
              <div className="text-4xl">📷</div>
              <p className="mt-3 text-sm font-medium text-gray-700">No photos yet</p>
              <p className="mt-1 text-xs text-gray-500">Photos will appear here once added from the admin panel (Website CMS → Gallery → Add Photos)</p>
            </div>
          ) : (
            <div className="space-y-10 sm:space-y-14">
              {albums.map((album: any, albumIdx: number) => (
                <div key={album.id} className="reveal">
                  <h2 className="text-lg font-bold text-gray-900 sm:text-xl">{album.title}</h2>
                  {album.description && <p className="mt-1 text-xs text-gray-500 sm:text-sm">{album.description}</p>}
                  <div className="mt-4 grid gap-2 grid-cols-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
                    {album.photos.map((photo: any, i: number) => (
                      <div key={i} className={`reveal reveal-delay-${(i % 4) + 1} group relative aspect-square overflow-hidden rounded-xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] sm:rounded-2xl`}>
                        <img src={photo.url} alt={photo.caption ?? ''} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        {photo.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 sm:p-3">
                            <p className="text-[10px] text-white sm:text-xs">{photo.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
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
