import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StudentPicker } from '@/components/app/student-picker';

const students = [
  { id: 'one', name: 'Anu', student_code: 'S001' },
  { id: 'two', name: 'Bala', student_code: 'S002' },
];
function Harness({ select }: { select: ReturnType<typeof vi.fn> }) {
  const [value, setValue] = useState('');
  return <StudentPicker value={value} onChange={setValue} onSelect={select} />;
}
function setup() {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ items: students, total: 2 }), { status: 200 }));
  const select = vi.fn();
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><Harness select={select} /></QueryClientProvider>);
  return select;
}
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe('StudentPicker keyboard selection', () => {
  it('loads an exact roll number with Enter without clicking a result', async () => {
    const select = setup();
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'S002' } });
    await screen.findByRole('option', { name: /Bala/ });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(select).toHaveBeenCalledWith(students[1]);
    expect(screen.queryByRole('listbox')).toBeNull();
  });
  it('supports arrow selection and does not select stale results after editing', async () => {
    const select = setup();
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'S00' } });
    await screen.findByRole('option', { name: /Anu/ });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(select).toHaveBeenCalledWith(students[1]);
    select.mockClear();
    fireEvent.change(input, { target: { value: 'new search' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(select).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
  });
});
