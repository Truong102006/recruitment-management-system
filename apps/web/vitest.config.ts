import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@rms/contracts/public': path.resolve(__dirname, '../../libs/contracts/public/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
    passWithNoTests: false,
    reporters: ['default', 'junit'],
    outputFile: { junit: '../../reports/frontend/junit.xml' },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.*', 'src/**/*.spec.*', 'src/**/*.d.ts', 'src/main.tsx'],
      reportsDirectory: '../../reports/frontend/coverage',
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: { lines: 80, branches: 70 },
    },
  },
});
