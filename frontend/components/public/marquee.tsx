'use client';

import { useEffect, useState } from 'react';

const DEFAULT_ANNOUNCEMENTS = [
  'Admissions Open for 2025-2026 — Limited Seats Available!',
  'Tuition Classes: LKG to 12th (SAMACHEER / STATE / CBSE)',
  'Music Classes Available: Keyboard, Drums & Tabla',
  'Congratulations to our students for excellent board results!',
  'Summer Classes — Handwriting, Basic Maths, Reading & Writing',
  'Contact: 044-4356 8296 | myacademy2009@gmail.com',
];

export function Marquee() {
  const [announcements, setAnnouncements] = useState<string[]>(DEFAULT_ANNOUNCEMENTS);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch('/api/public/website-config');
        if (res.ok) {
          const data = await res.json();
          if (data.announcements && data.announcements.length > 0) {
            setAnnouncements(data.announcements);
          }
        }
      } catch {
        // Keep defaults on error
      }
    };
    fetchAnnouncements();
  }, []);

  return (
    <div className="bg-[#1e1b4b] shadow-sm">
      <div className="marquee-container py-2">
        <div className="marquee-content">
          {announcements.map((text, i) => (
            <span key={i} className="mx-6 text-sm font-medium tracking-wide text-yellow-400">
              {text}
              {i < announcements.length - 1 && (
                <span className="mx-5 text-white/30">◆</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
