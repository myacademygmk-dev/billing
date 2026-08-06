'use client';

import { useEffect, useState } from 'react';

export function Marquee() {
  const [announcements, setAnnouncements] = useState<string[] | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch('/api/backend/public/website-config');
        if (res.ok) {
          const data = await res.json();
          if (data.announcements && data.announcements.length > 0) {
            setAnnouncements(data.announcements);
          } else {
            setAnnouncements([]);
          }
        } else {
          setAnnouncements([]);
        }
      } catch {
        setAnnouncements([]);
      }
    };
    fetchAnnouncements();
  }, []);

  if (!announcements || announcements.length === 0) return null;

  const text = announcements.join('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 ◆ \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0');

  return (
    <div className="bg-[#1e1b4b] shadow-sm overflow-hidden">
      <div className="py-2 whitespace-nowrap animate-marquee">
        <span className="text-sm font-medium tracking-wide text-yellow-400 px-4">{text}</span>
      </div>
    </div>
  );
}
