import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ClassMarksDialog } from '@/components/app/class-marks-dialog';
import { Toaster } from '@/components/ui/toaster';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it('saves a class batch, accepts zero, and excludes already recorded students', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
    if (init?.method === 'POST') return new Response('[]', { status: 201 });
    return new Response(JSON.stringify(String(url).includes('/exams/marks')
      ? { items: [{ student_id: 'one', subject_id: 'math', marks_obtained: '80' }] }
      : { items: [{ id: 'one', name: 'Anu', student_code: 'S001' }, { id: 'two', name: 'Bala', student_code: 'S002' }], total: 2 }), { status: 200 });
  });
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><Toaster><ClassMarksDialog examId="exam" classes={[{ id: 'class', class_name: '10', section: null, subjects: [{ id: 'math', name: 'Mathematics', max_marks: 100 }] }]} onClose={vi.fn()} /></Toaster></QueryClientProvider>);
  fireEvent.change(screen.getByLabelText('Class roster'), { target: { value: 'class' } });
  fireEvent.change(screen.getByLabelText('Roster subject'), { target: { value: 'math' } });
  const input = await screen.findByRole('spinbutton', { name: /Bala/ });
  expect((screen.getByRole('spinbutton', { name: /Anu/ }) as HTMLInputElement).disabled).toBe(true);
  fireEvent.change(input, { target: { value: '101' } });
  expect((screen.getByRole('button', { name: 'Save 1 marks' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(input, { target: { value: '0' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save 1 marks' }));
  await waitFor(() => expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(true));
  expect(JSON.parse(String(fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')?.[1]?.body))).toEqual({ exam_id: 'exam', marks: [{ student_id: 'two', subject_id: 'math', marks_obtained: 0, max_marks: 100 }] });
});
