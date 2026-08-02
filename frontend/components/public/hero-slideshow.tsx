'use client';

import { useEffect, useState } from 'react';

const SLIDES = [
  '/images/1920x730_slide1.jpg',
  '/images/1920x730_slide2.jpg',
];

export function HeroSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0">
      {SLIDES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
          style={{
            backgroundImage: `url(${src})`,
            opacity: i === currentIndex ? 1 : 0,
          }}
          aria-hidden={i !== currentIndex}
        />
      ))}
      {/* Purple-to-Indigo gradient overlay — reduced opacity to show images */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed]/75 via-[#4f46e5]/70 to-[#1e1b4b]/80" />
    </div>
  );
}
