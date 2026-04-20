import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@common': resolve(__dirname, 'src/common'),
      '@modules': resolve(__dirname, 'src/modules'),
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    include: ['test/**/*.{test,spec,e2e-spec}.ts', 'src/**/*.{test,spec}.ts'],
    globals: true,
  },
});
