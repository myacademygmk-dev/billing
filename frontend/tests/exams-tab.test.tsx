import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ExamsTab } from '@/components/app/exams-tab';
import { Toaster } from '@/components/ui/toaster';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('opens a class-scoped exam sheet and shows recorded marks as a student table', async () => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    const path = String(url);
    const body = path.includes('/auth/me') ? { role: 'staff', permissions: ['exams'] }
      : path.includes('/academic/classes') ? [{ id: 'class', class_name: '10', section: null, subjects: [{ id: 'math', name: 'Math', max_marks: 100 }] }]
      : path.includes('/roster') ? { items: [{ id: 'student', name: 'Anu', student_code: 'S001' }] }
      : path.includes('/exams/marks') ? { items: [{ id: 'mark', student_id: 'student', subject_id: 'math', student_name: 'Anu', subject_name: 'Math', marks_obtained: '0.00', max_marks: 100 }] }
      : { items: [{ id: 'exam', name: 'Quarterly', exam_type: 'quarterly', class_section_id: 'class', start_date: null, end_date: null }], total: 1 };
    return new Response(JSON.stringify(body), { status: 200 });
  });
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><Toaster><ExamsTab yearId="year" /></Toaster></QueryClientProvider>);
  fireEvent.click(await screen.findByRole('button', { name: 'View marks for Quarterly' }));
  expect(await screen.findByRole('region', { name: 'Recorded marks table' })).toBeTruthy();
  expect(screen.getByText('0 / 100')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'New exam' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Open marks sheet' }));
  const cell = await screen.findByRole('spinbutton', { name: /Anu.*Math/ });
  expect((cell as HTMLInputElement).value).toBe('0.00');
  expect((cell as HTMLInputElement).disabled).toBe(true);
});
