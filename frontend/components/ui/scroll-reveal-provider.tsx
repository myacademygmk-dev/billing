'use client';

import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Global scroll reveal: any element with class "reveal", "reveal-left", or "reveal-right"
 * will animate in when scrolled into view. Elements already in viewport on page load
 * are revealed immediately.
 */
export function ScrollRevealProvider() {
  const pathname = usePathname();

  const initObserver = useCallback(() => {
    // Small delay to ensure DOM is ready after navigation
    setTimeout(() => {
      const elements = document.querySelectorAll('.reveal:not(.revealed), .reveal-left:not(.revealed), .reveal-right:not(.revealed)');
      if (elements.length === 0) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
      );

      elements.forEach((el) => {
        // If element is already in viewport, reveal immediately
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('revealed');
        } else {
          observer.observe(el);
        }
      });

      return () => observer.disconnect();
    }, 100);
  }, []);

  // Re-run on pathname change (client navigation)
  useEffect(() => {
    initObserver();
  }, [pathname, initObserver]);

  // Also run on initial mount
  useEffect(() => {
    initObserver();
  }, [initObserver]);

  return null;
}
