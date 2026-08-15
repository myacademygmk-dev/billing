'use client';

import { useEffect, useState } from 'react';

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    let videoId = '';
    if (parsed.hostname.includes('youtube.com')) {
      videoId = parsed.searchParams.get('v') || '';
    } else if (parsed.hostname.includes('youtu.be')) {
      videoId = parsed.pathname.slice(1);
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch {}
  return null;
}

export function OurVideos() {
  const [videos, setVideos] = useState<string[] | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch('/api/backend/public/website-config');
        if (res.ok) {
          const data = await res.json();
          if (data.videos && data.videos.length > 0) {
            setVideos(data.videos.slice(0, 3));
          } else {
            setVideos([]);
          }
        } else {
          setVideos([]);
        }
      } catch {
        setVideos([]);
      }
    };
    fetchVideos();
  }, []);

  // Don't render section if no videos
  if (videos !== null && videos.length === 0) return null;

  return (
    <section className="relative overflow-hidden py-14 bg-white">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center reveal">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-teal-600">Media</div>
          <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Our Videos</span>
          </h2>
          <p className="mt-2 text-sm text-gray-500 max-w-lg mx-auto">Watch our students in action and get a glimpse of life at MY Academy.</p>
        </div>

        {videos === null ? (
          /* Loading state */
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-video rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {videos.map((url, i) => {
              const embedUrl = getYouTubeEmbedUrl(url);
              if (!embedUrl) return null;
              return (
                <div key={i} className="group relative overflow-hidden rounded-xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
                  <div className="aspect-video">
                    <iframe
                      src={embedUrl}
                      title={`Video ${i + 1}`}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
