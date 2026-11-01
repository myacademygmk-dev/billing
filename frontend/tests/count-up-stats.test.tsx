import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { CountUpStats } from '@/components/public/count-up-stats';
import { WebsiteConfigProvider, type WebsiteConfig } from '@/components/public/website-config-context';

afterEach(cleanup);

function view(stats: WebsiteConfig['stats']) {
  return <WebsiteConfigProvider config={{ stats }}><CountUpStats /></WebsiteConfigProvider>;
}

it('displays saved values, including zero, formatted counts and Alumni, and responds to updates', () => {
  const { rerender } = render(view({ students: '1,250+', staff: '0', years: '17+', standards: 'LKG-10', alumni: '500+' }));
  for (const value of ['1,250+', '0', '17+', 'LKG-10', '500+', 'Alumni']) {
    expect(screen.getByText(value)).toBeTruthy();
  }
  rerender(view({ students: '300+', staff: '25', years: '18', standards: '1-12', alumni: '650' }));
  expect(screen.queryByText('1,250+')).toBeNull();
  expect(screen.getByText('300+')).toBeTruthy();
  expect(screen.getByText('650')).toBeTruthy();
});

it('does not invent counts when settings are empty', () => {
  render(view({}));
  expect(screen.getAllByText('—')).toHaveLength(5);
});
