import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Countdown } from '@/components/public/countdown';
import { WebsiteConfigProvider } from '@/components/public/website-config-context';
import { WebsiteCountdownEditor, type CountdownDraft } from '@/components/website-countdown-editor';
import { WebsiteCollectionEditor } from '@/components/website-collection-editor';
import { FacilitiesSection } from '@/app/(public)/about/facilities-section';
import { uploadWebsiteFile } from '@/lib/website-upload';
vi.mock('@/lib/website-upload', () => ({ uploadWebsiteFile: vi.fn() }));
afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks(); });

it('limits countdown creation to four and allows editing and removal', () => {
  function Editor() {
    const [value, setValue] = useState<CountdownDraft[]>([]);
    return <WebsiteCountdownEditor value={value} onChange={setValue} />;
  }
  render(<Editor />);
  const add = screen.getByRole('button', { name: 'Add countdown' });
  for (let i = 0; i < 4; i++) fireEvent.click(add);
  expect((add as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getAllByLabelText('Event title')[0], { target: { value: 'Annual Day' } });
  expect(screen.getByDisplayValue('Annual Day')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Remove countdown 2' }));
  expect((add as HTMLButtonElement).disabled).toBe(false);
});

it('shows at most four upcoming timers, hides invalid dates and expires them', () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));
  const countdowns = [{ title: 'Expired', date: '2020-01-01' }, { title: 'Invalid', date: 'bad' }, ...Array.from({ length: 5 }, (_, i) => ({ title: `Event ${i}`, date: '2030-01-01T00:00:02Z' }))];
  render(<WebsiteConfigProvider config={{ countdowns }}><Countdown /></WebsiteConfigProvider>);
  expect(screen.getAllByRole('article')).toHaveLength(4);
  expect(screen.queryByText('Expired')).toBeNull();
  expect(screen.queryByText('Invalid')).toBeNull();
  act(() => { vi.advanceTimersByTime(3000); });
  expect(screen.queryByRole('region', { name: 'Upcoming events' })).toBeNull();
});

it('preserves the legacy timer but honors explicit removal', () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2030-01-01'));
  const config = { countdown_date: '2031-01-01', countdown_title: 'Legacy' };
  const { rerender } = render(<WebsiteConfigProvider config={config}><Countdown /></WebsiteConfigProvider>);
  expect(screen.getByText('Legacy')).toBeTruthy();
  rerender(<WebsiteConfigProvider config={{ ...config, countdowns: [] }}><Countdown /></WebsiteConfigProvider>);
  expect(screen.queryByText('Legacy')).toBeNull();
});

it('edits collection text, replaces its image, and removes the entry', async () => {
  vi.mocked(uploadWebsiteFile).mockResolvedValue({ url: '/api/uploads/files/new.webp', size: 10 });
  const busy = vi.fn();
  function Editor() {
    const [value, setValue] = useState('[{"name":"Library","photo_url":"/images/old.jpg"}]');
    return <WebsiteCollectionEditor title="Facilities" value={value} onChange={setValue} fields={[{ key: 'name', label: 'Facility name' }]} onBusyChange={busy} />;
  }
  render(<Editor />);
  fireEvent.change(screen.getByLabelText('Facility name'), { target: { value: 'Science lab' } });
  fireEvent.change(screen.getByLabelText('Replace image'), { target: { files: [new File(['image'], 'lab.jpg', { type: 'image/jpeg' })] } });
  await waitFor(() => expect(screen.getByAltText('Science lab preview').getAttribute('src')).toBe('/api/uploads/files/new.webp'));
  expect(busy).toHaveBeenCalledWith(true); expect(busy).toHaveBeenCalledWith(false);
  fireEvent.click(screen.getByRole('button', { name: 'Remove entry 1' }));
  expect(screen.queryByLabelText('Facility name')).toBeNull();
});

it('renders saved facilities and respects an empty list', () => {
  const { rerender } = render(<WebsiteConfigProvider config={{ facilities: [{ name: 'Science lab', description: 'Practical learning', photo_url: '/images/lab.jpg' }] }}><FacilitiesSection /></WebsiteConfigProvider>);
  expect(screen.getByText('Science lab')).toBeTruthy();
  expect(screen.getByAltText('Science lab').getAttribute('src')).toBe('/images/lab.jpg');
  expect(screen.queryByText('CCTV Surveillance')).toBeNull();
  rerender(<WebsiteConfigProvider config={{ facilities: [] }}><FacilitiesSection /></WebsiteConfigProvider>);
  expect(screen.queryByText('Science lab')).toBeNull();
});
