import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { BarChart } from '@/components/ui/charts';

afterEach(cleanup);
it('shows positive, negative, and zero revenue with readable values', () => {
  const { container } = render(<BarChart data={[{ label: 'Jan', value: 2000 }, { label: 'Feb', value: -500 }, { label: 'Mar', value: 0 }]} />);
  expect(screen.getByRole('region', { name: 'Monthly revenue chart' })).toBeTruthy();
  expect(screen.getByText('2.0k')).toBeTruthy();
  expect(screen.getAllByText('-500').length).toBeGreaterThan(0);
  for (const bar of container.querySelectorAll<HTMLElement>('[style]')) {
    expect(bar.style.height.startsWith('-')).toBe(false);
    expect(bar.style.cssText).not.toContain('NaN');
  }
});
