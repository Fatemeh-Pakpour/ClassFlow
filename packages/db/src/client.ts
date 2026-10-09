import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema/index.ts';

export type Database = NodePgDatabase<typeof schema>;

export interface DbClient {
  db: Database;
  pool: pg.Pool;
}

export interface CreateDbOptions {
  connectionString: string;
  /** Max pooled connections per process. Keep (apps × replicas × max) under Postgres max_connections. */
  maxConnections?: number;
  /** Tag connections in pg_stat_activity, e.g. "classflow-api". */
  applicationName?: string;
  logQueries?: boolean;
}

/**
 * Creates one pool + Drizzle instance. Call it once per process and close
 * the pool on shutdown (`await client.pool.end()`).
 */
export function createDb(options: CreateDbOptions): DbClient {
  const pool = new pg.Pool({
    connectionString: options.connectionString,
    max: options.maxConnections ?? 10,
    application_name: options.applicationName,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  const db = drizzle({
    client: pool,
    schema,
    casing: 'snake_case',
    logger: options.logQueries ?? false,
  });

  return { db, pool };
}
