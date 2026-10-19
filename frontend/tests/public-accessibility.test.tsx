import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PublicNav } from '@/components/public/nav';
import { HeroSlideshow } from '@/components/public/hero-slideshow';
import { Marquee } from '@/components/public/marquee';
import { OurVideos } from '@/components/public/our-videos';
import { WebsiteConfigProvider } from '@/components/public/website-config-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { monthlyStudentsExportHref } from '@/app/(app)/reports/tabs/reports-tab';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('public navigation accessibility', () => {
  it('opens desktop dropdowns with keyboard activation', () => {
    render(<PublicNav />);

    const about = screen.getByRole('button', { name: /about us/i });
    expect(about.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(about);

    expect(about.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('menuitem', { name: /faculty/i })).toBeTruthy();
  });

  it('closes the mobile menu with Escape and restores trigger focus', () => {
    render(<PublicNav />);

    const trigger = screen.getByRole('button', { name: /toggle menu/i });
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByRole('dialog', { name: /website navigation/i })).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: /website navigation/i })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});

describe('shared dialog accessibility', () => {
  it('uses the dialog title as the accessible name', () => {
    render(
      <Dialog open onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByRole('dialog', { name: /confirm payment/i })).toBeTruthy();
  });
});

describe('monthly student export URL', () => {
  it('keeps table filters in the CSV export URL', () => {
    const href = monthlyStudentsExportHref({
      month: '2026-07',
      paymentState: 'unpaid',
      search: '  Priya  ',
      classCode: '10',
    });

    expect(href).toBe('/api/backend/export/monthly-students.csv?month=2026-07-01&payment_state=unpaid&search=Priya&class_code=10');
  });
});

describe('public config consumers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders from shared config without duplicate client config fetches', () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    render(
      <WebsiteConfigProvider
        config={{
          announcements: ['Admissions Open'],
          hero_slides: ['/images/custom-slide.jpg'],
          videos: ['https://youtu.be/abcdef1'],
        }}
      >
        <Marquee />
        <HeroSlideshow />
        <OurVideos />
      </WebsiteConfigProvider>
    );

    expect(screen.getByText(/Admissions Open/i)).toBeTruthy();
    expect(screen.getByAltText('Slide 1').getAttribute('src')).toBe('/images/custom-slide.jpg');
    expect(screen.getByTitle('Video 1').getAttribute('src')).toBe('https://www.youtube.com/embed/abcdef1');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
