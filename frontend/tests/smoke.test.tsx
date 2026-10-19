import { describe, expect, it } from 'vitest';
import { isValidElement } from 'react';

import RootLayout from '@/app/layout';

describe('frontend smoke', () => {
  it('builds the root layout element tree', () => {
    const tree = RootLayout({ children: <div>ok</div> });

    expect(isValidElement(tree)).toBe(true);
    expect(tree.type).toBe('html');
    expect(tree.props.lang).toBe('en');
    expect(tree.props.children.type).toBe('body');
  });
});
