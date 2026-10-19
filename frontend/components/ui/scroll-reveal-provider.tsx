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
    const selector = '.reveal:not(.revealed), .reveal-left:not(.revealed), .reveal-right:not(.revealed)';
    const observed = new WeakSet<Element>();
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

    const observeTargets = () => {
      document.querySelectorAll(selector).forEach((el) => {
        if (observed.has(el)) return;
        observed.add(el);
        observer.observe(el);
      });
    };

    const mutationObserver = new MutationObserver(observeTargets);
    const timeout = setTimeout(observeTargets, 100);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timeout);
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
