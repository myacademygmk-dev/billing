'use client';

import { ReactNode, createContext, useContext } from 'react';

export type WebsiteConfig = {
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
