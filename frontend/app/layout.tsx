import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Lexend, Source_Sans_3 } from 'next/font/google';
import { Providers } from '@/lib/providers';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const lexend = Lexend({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const sourceSans = Source_Sans_3({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = {
  title: 'MY ACADEMY',
  description: 'MY ACADEMY — Gain More Knowledge. Quality education since 2009.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light" className={`${lexend.variable} ${sourceSans.variable}`}>
      <body>
        <Providers>
          <Toaster>
            {children}
          </Toaster>
        </Providers>
      </body>
    </html>
  );
}
