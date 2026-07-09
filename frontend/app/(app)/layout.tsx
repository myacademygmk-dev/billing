import { ReactNode } from 'react';

import { SetLightTheme } from '@/components/app/set-theme';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SetLightTheme />
      {children}
    </>
  );
}
