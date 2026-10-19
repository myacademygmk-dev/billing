'use client';

import { useEffect, useState } from 'react';
import { useWebsiteConfig } from '@/components/public/website-config-context';

/**
 * Popup banner that shows on page load/refresh.
 * Fetches banner image URL from /api/backend/public/website-config.
 * User can close it with X button. Won't show again in the same session.
 */
export function PopupBanner() {
  const [show, setShow] = useState(false);
  const config = useWebsiteConfig();
  const imageUrl = config.popup_banner_url || config.hero_image_url || null;

  useEffect(() => {
    if (sessionStorage.getItem('popup_banner_closed')) return;
    if (imageUrl) setShow(true);
  }, [imageUrl]);

  function handleClose() {
    setShow(false);
    sessionStorage.setItem('popup_banner_closed', '1');
  }

  if (!show || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:p-10"
      onClick={handleClose}
    >
      {/* Banner image - constrained to fit screen */}
      <div
        className="relative max-w-md w-full max-h-[80vh] animate-[scaleIn_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button - on the image */}
        <button
          onClick={handleClose}
          className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-800 shadow-lg transition-transform hover:scale-110 hover:bg-gray-100"
          aria-label="Close banner"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <img
          src={imageUrl}
          alt="Announcement"
          className="w-full h-auto max-h-[80vh] object-contain rounded-xl shadow-2xl"
        />
      </div>
    </div>
  );
}
