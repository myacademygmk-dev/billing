'use client';

import { useEffect } from 'react';

export function SetLightTheme() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    return () => {
      document.documentElement.removeAttribute('data-theme');
    };
  }, []);
  return null;
}
