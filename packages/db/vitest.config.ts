import { existsSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// Local runs read TEST_DATABASE_ADMIN_URL from packages/db/.env; CI sets it directly.
if (existsSync('.env')) process.loadEnvFile('.env');

export default defineConfig({
  test: {
    include: ['test/**/*.integration-spec.ts'],
    // Each file creates, migrates and drops its own database.
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
});
