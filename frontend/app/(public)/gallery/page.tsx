export const dynamic = 'force-dynamic';

import GalleryClient from './gallery-client';

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
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] py-16 sm:py-20">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-indigo-200">
            <span>Home</span>
            <span>/</span>
            <span className="text-white font-medium">Gallery</span>
          </div>
          <h1 className="mt-4 text-4xl font-bold text-white sm:text-5xl">Gallery</h1>
          <p className="mt-3 text-lg text-indigo-100">Moments from our events and activities</p>
        </div>
      </section>

      {/* Gallery Content */}
      <section className="bg-[#f5f3ff] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {albums.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-md border border-indigo-100">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#4f46e5]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                </svg>
              </div>
              <p className="mt-4 text-lg font-semibold text-gray-900">No photos yet</p>
              <p className="mt-2 text-sm text-gray-500">Photos will appear here once added from the admin panel (Website CMS → Gallery → Add Photos)</p>
            </div>
          ) : (
            <GalleryClient albums={albums} />
          )}
        </div>
      </section>
    </div>
  );
}
