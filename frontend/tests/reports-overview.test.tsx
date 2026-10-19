import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import ReportsTab from '@/app/(app)/reports/tabs/reports-tab';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function setup() {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    const path = String(url);
    const data = path.includes('/summary') ? { paid_students: 8, unpaid_students: 2, month_total: '8000', today_total: '1000' }
      : path.includes('/annual') ? { monthly_breakdown: [{ month: 1, month_name: 'January', total: '8000', payment_count: 8 }], mode_breakdown: [{ mode: 'cash', total: '8000', payment_count: 8 }] }
        : [{ student_id: 'student-1', student_code: 'S001', name: 'Ananya', class_name: '10 A', monthly_fee: '1000', month_label: 'Jan 2026', is_paid: false }];
    return new Response(JSON.stringify(data), { status: 200 });
  });
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><ReportsTab /></QueryClientProvider>);
  return fetchMock;
}

it('loads student details only when requested and preserves the unpaid drill-down', async () => {
  const fetchMock = setup();
  await screen.findByText('Cash');
  expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/monthly-students'))).toBe(false);
  expect(screen.queryByRole('button', { name: 'Export CSV' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Review unpaid students' }));
  await screen.findByText('Ananya');
  expect((screen.getByLabelText('Payment status') as HTMLSelectElement).value).toBe('unpaid');
  expect(screen.getByRole('link', { name: 'Ananya' }).getAttribute('href')).toBe('/students/student-1');
  expect(screen.getByRole('button', { name: 'Export CSV' })).toBeTruthy();
});

it('does not request an invalid chart range', async () => {
  const fetchMock = setup();
  await screen.findByText('Cash');
  const count = fetchMock.mock.calls.length;
  fireEvent.change(screen.getByLabelText('From'), { target: { value: '2099-12' } });
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('end month'));
  expect(fetchMock.mock.calls.length).toBe(count);
  expect(screen.queryByRole('region', { name: 'Revenue trend' })).toBeNull();
});
