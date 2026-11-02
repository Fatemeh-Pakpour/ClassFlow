import { existsSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

// Local runs read TEST_DATABASE_ADMIN_URL from apps/api/.env; CI sets it directly.
// Each file creates and drops its own database; DATABASE_URL is never used.
if (existsSync('.env')) process.loadEnvFile('.env');

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.integration-spec.ts'],
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
});
