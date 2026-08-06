'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Watches every .reveal / .reveal-left / .reveal-right element on the page
 * and adds the .revealed class once it scrolls into view. Re-observes on
 * route changes so new pages get their animations too.
 */
export function ScrollRevealProvider() {
  const pathname = usePathname();

  useEffect(() => {
    // Small delay to let new page DOM render
    const timeout = setTimeout(() => {
      const targets = document.querySelectorAll('.reveal:not(.revealed), .reveal-left:not(.revealed), .reveal-right:not(.revealed)');
      if (targets.length === 0) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
      );

      targets.forEach((el) => observer.observe(el));
      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timeout);
  }, [pathname]);

  return null;
}
