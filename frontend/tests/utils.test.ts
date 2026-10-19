import { describe, expect, it, vi } from 'vitest';

import { cn } from '@/components/ui/cn';
import { debounce } from '@/lib/debounce';

describe('ui utilities', () => {
  it('merges conditional and conflicting Tailwind classes', () => {
    expect(cn('px-2', false && 'hidden', 'px-4', ['text-sm'])).toBe('px-4 text-sm');
  });

  it('debounces calls to the last invocation', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('first');
    debounced('second');
    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('second');
    vi.useRealTimers();
  });
});
