import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

import { SetLightTheme } from '@/components/app/set-theme';

export default function AppLayout({ children }: { children: ReactNode }) {
  const token = cookies().get('access_token')?.value;
  if (!token) redirect('/login');
  return (
    <>
      <SetLightTheme />
      {children}
    </>
  );
}
