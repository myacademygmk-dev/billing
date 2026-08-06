'use client';

import { useEffect, useState } from 'react';

const DEFAULT_SLIDES = [
  '/images/1920x730_slide1.jpg',
  '/images/1920x730_slide2.jpg',
];

export function HeroSlideshow() {
  const [slides, setSlides] = useState<string[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await fetch('/api/backend/public/website-config');
        if (res.ok) {
          const data = await res.json();
          if (data.hero_slides && data.hero_slides.length > 0) {
            setSlides(data.hero_slides);
          } else {
            setSlides(DEFAULT_SLIDES);
          }
        } else {
          setSlides(DEFAULT_SLIDES);
        }
      } catch {
        setSlides(DEFAULT_SLIDES);
      }
    };
    fetchSlides();
  }, []);

  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides]);

  // Show nothing until we know which slides to display (prevents flash)
  if (!slides) {
    return (
      <div className="w-full h-[300px] sm:h-[400px] lg:h-[500px] bg-gray-100 animate-pulse" />
    );
  }

  return (
    <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px] overflow-hidden">
      {slides.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={`Slide ${i + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out`}
          style={{ opacity: i === currentIndex ? 1 : 0 }}
        />
      ))}
    </div>
  );
}
