import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
    passWithNoTests: false,
    reporters: ['default', 'junit'],
    outputFile: { junit: '../../reports/frontend/junit.xml' },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.*', 'src/**/*.spec.*', 'src/**/*.d.ts'],
      reportsDirectory: '../../reports/frontend/coverage',
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: { lines: 80, branches: 70 },
    },
  },
});
