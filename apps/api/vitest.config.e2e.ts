import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Explicit test env so e2e runs don't depend on a local .env (e.g. in CI).
    env: {
      NODE_ENV: 'test',
      CORS_ORIGINS: 'http://localhost:3000',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      RABBITMQ_URL: 'amqp://test:test@localhost:5672/test',
    },
  },
});
