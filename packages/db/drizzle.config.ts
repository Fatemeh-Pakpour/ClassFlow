import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

// Local dev reads packages/db/.env; CI/production pass DATABASE_URL directly.
if (existsSync('.env')) process.loadEnvFile('.env');

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set (see packages/db/.env.example)');

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url },
  // Must match the client in src/client.ts.
  casing: 'snake_case',
  // Ask before running statements that may lose data (push), and print the SQL.
  strict: true,
  verbose: true,
});
