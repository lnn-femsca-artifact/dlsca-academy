import { defineConfig } from 'vitest/config';

// Unit tests are deliberately isolated from Playwright browser suites.
// Vitest's default **/*.spec.ts glob would otherwise pick up tests/e2e.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
