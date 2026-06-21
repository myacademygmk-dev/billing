import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'next/font/google': path.resolve(__dirname, 'tests/__mocks__/next-font.ts'),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
});
