'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Animated circular progress ring — fills from 0 to `percent` once it
 * scrolls into view. Wrap a medal/icon in it to turn a static badge into
 * a real "score visualized" element (Apple Fitness / Duolingo style),
 * instead of just a flat colored circle.
 */
export function ScoreRing({
  percent,
  color,
  size = 48,
  strokeWidth = 3,
  children,
}: {
  percent: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  children?: ReactNode;
}) {
  const [progress, setProgress] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            const startTime = performance.now();
            const duration = 1100;
            const step = (currentTime: number) => {
              const elapsed = currentTime - startTime;
              const t = Math.min(elapsed / duration, 1);
              const eased = 1 - Math.pow(1 - t, 3);
              setProgress(eased * percent);
              if (t < 1) requestAnimationFrame(step);
              else setProgress(percent);
            };
            requestAnimationFrame(step);
          }
        });
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasAnimated, percent]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div ref={ref} className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}
