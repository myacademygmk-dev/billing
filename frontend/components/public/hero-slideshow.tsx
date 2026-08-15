'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

const DEFAULT_SLIDES = [
  '/images/1920x730_slide1.jpg',
  '/images/1920x730_slide2.jpg',
];

export function HeroSlideshow() {
  const [slides, setSlides] = useState<string[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

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

  const goToSlide = useCallback((index: number) => {
    if (!slides) return;
    setCurrentIndex((index + slides.length) % slides.length);
  }, [slides]);

  const goNext = useCallback(() => {
    if (!slides) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides]);

  const goPrev = useCallback(() => {
    if (!slides) return;
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides]);

  // Auto-advance
  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [slides]);

  // Touch/swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  };

  // Show nothing until we know which slides to display (prevents flash)
  if (!slides) {
    return (
      <div className="w-full h-[300px] sm:h-[400px] lg:h-[500px] bg-gray-100 animate-pulse" />
    );
  }

  return (
    <div
      className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px] overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      {slides.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={`Slide ${i + 1}`}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === currentIndex ? 1 : 0 }}
        />
      ))}

      {/* Left Arrow */}
      {slides.length > 1 && (
        <button
          onClick={goPrev}
          className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all duration-300 hover:bg-black/60 ${
            isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
          }`}
          aria-label="Previous slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}

      {/* Right Arrow */}
      {slides.length > 1 && (
        <button
          onClick={goNext}
          className={`absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all duration-300 hover:bg-black/60 ${
            isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
          }`}
          aria-label="Next slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      )}

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? 'w-7 bg-white'
                  : 'w-2.5 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
