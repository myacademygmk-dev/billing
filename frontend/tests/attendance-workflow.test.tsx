import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import AttendanceTab from '@/app/(app)/students/tabs/attendance-tab';
import { Toaster } from '@/components/ui/toaster';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it('marks only remaining students present and preserves an existing absence', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
    if (init?.method === 'POST') return new Response('{}', { status: 200 });
    const data = String(url).includes('/students/classes') ? ['10 A'] : { total: 2, marked: 1, items: [
      { student_id: 'absent', student_name: 'Anu', student_code: 'S001', status: 'absent' },
      { student_id: 'unmarked', student_name: 'Bala', student_code: 'S002', status: 'not_marked' },
    ] };
    return new Response(JSON.stringify(data), { status: 200 });
  });
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><Toaster><AttendanceTab /></Toaster></QueryClientProvider>);
  await screen.findByRole('option', { name: '10 A' });
  fireEvent.change(screen.getByLabelText('Attendance class'), { target: { value: '10 A' } });
  await screen.findByText('Anu');
  fireEvent.click(screen.getByRole('button', { name: 'Remaining present' }));
  expect(screen.getByRole('button', { name: 'Anu: Absent' }).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('button', { name: 'Bala: Present' }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Save (1)' }));
  await waitFor(() => expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(true));
  const submitted = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
  expect(JSON.parse(String(submitted?.[1]?.body)).entries).toEqual([{ student_id: 'unmarked', status: 'present' }]);
});
