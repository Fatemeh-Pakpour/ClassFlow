import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createDb } from './client.ts';

/**
 * Applies pending SQL migrations from ./drizzle.
 * Used in deployments (`pnpm --filter @classflow/db migrate:prod`) as a
 * one-off step before new app versions start, so apps never migrate on boot
 * and multiple replicas can't race each other.
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url));
const { db, pool } = createDb({
  connectionString,
  maxConnections: 1,
  applicationName: 'classflow-migrate',
});

try {
  await migrate(db, { migrationsFolder });
  console.log('Migrations applied');
} catch (error) {
  console.error('Migration failed', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
