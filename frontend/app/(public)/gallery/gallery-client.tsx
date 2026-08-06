'use client';

import { useState, useCallback, useEffect } from 'react';

interface Photo {
  url: string;
  caption?: string;
}

interface Album {
  id: string;
  title: string;
  description?: string;
  photos: Photo[];
}

export default function GalleryClient({ albums }: { albums: Album[] }) {
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);

  const closeLightbox = useCallback(() => setLightboxPhoto(null), []);

  useEffect(() => {
    if (!lightboxPhoto) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxPhoto, closeLightbox]);

  return (
    <>
      <div className="space-y-14">
        {albums.map((album) => (
          <div key={album.id} className="reveal">
            <h2 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] bg-clip-text text-transparent">{album.title}</span>
            </h2>
            {album.description && <p className="mt-2 text-gray-600">{album.description}</p>}
            <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {album.photos.map((photo, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLightboxPhoto(photo)}
                  className={`reveal reveal-delay-${(i % 6) + 1} group relative aspect-square overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:ring-offset-2`}
                  aria-label={photo.caption ? `View photo: ${photo.caption}` : 'View photo'}
                >
                  <img src={photo.url} alt={photo.caption ?? ''} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#4f46e5]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {photo.caption && (
                    <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-sm text-white font-medium">{photo.caption}</p>
                    </div>
                  )}
                  {/* Zoom icon on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#4f46e5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Photo lightbox"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Close lightbox"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image */}
          <div
            className="relative max-h-[85vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxPhoto.url}
              alt={lightboxPhoto.caption ?? ''}
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            />
            {lightboxPhoto.caption && (
              <div className="absolute inset-x-0 bottom-0 rounded-b-lg bg-gradient-to-t from-black/70 to-transparent p-4 pt-8">
                <p className="text-center text-sm font-medium text-white">{lightboxPhoto.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
