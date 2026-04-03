import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    root: './src',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
