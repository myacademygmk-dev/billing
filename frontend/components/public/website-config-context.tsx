'use client';

import { ReactNode, createContext, useContext } from 'react';

export type WebsiteConfig = {
  countdowns?: { title: string; date: string }[] | null;
  facilities?: { name?: string; title?: string; description?: string; photo_url?: string; image?: string }[] | null;
  alumni?: Record<string, string | number>[] | null;
  stats?: {
    students?: string | null;
    staff?: string | null;
    years?: string | null;
    standards?: string | null;
    alumni?: string | null;
  };
  institution?: {
    registration_no?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  top_bar_text?: string | null;
  announcements?: string[];
  popup_banner_url?: string | null;
  hero_image_url?: string | null;
  hero_slides?: string[];
  videos?: string[];
  countdown_date?: string | null;
  countdown_title?: string | null;
};

const WebsiteConfigContext = createContext<WebsiteConfig>({});

export function WebsiteConfigProvider({
  config,
  children,
}: {
  config: WebsiteConfig;
  children: ReactNode;
}) {
  return (
    <WebsiteConfigContext.Provider value={config}>
      {children}
    </WebsiteConfigContext.Provider>
  );
}

export function useWebsiteConfig() {
  return useContext(WebsiteConfigContext);
}
