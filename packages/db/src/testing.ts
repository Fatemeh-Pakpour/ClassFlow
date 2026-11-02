import { randomBytes } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { createDb, type Database, type DbClient } from './client.ts';
import { migrationsFolder } from './migrations.ts';

/**
 * Integration-test helpers (`@classflow/db/testing`). Not for application code.
 *
 * TEST_DATABASE_ADMIN_URL is a maintenance connection used only to create and
 * drop the disposable `classflow_test_*` databases below; tests never write to
 * the database it names. There is deliberately no fallback to DATABASE_URL.
 */
const TEST_DATABASE_PREFIX = 'classflow_test_';

export interface TestDatabase extends DbClient {
  name: string;
  /** Closes the pool and drops the database. */
  destroy(): Promise<void>;
}

function testDatabaseAdminUrl(): string {
  const url = process.env.TEST_DATABASE_ADMIN_URL;
  if (!url) {
    throw new Error(
      'TEST_DATABASE_ADMIN_URL is not set. Integration tests need a disposable PostgreSQL ' +
        'server (see docs/testing.md) and never fall back to DATABASE_URL.',
    );
  }
  return url;
}

async function withAdminClient(adminUrl: string, statement: string): Promise<void> {
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    await client.query(statement);
  } finally {
    await client.end();
  }
}

/** Creates an empty, uniquely named database. Apply migrations with `migrateTestDatabase`. */
export async function createTestDatabase(): Promise<TestDatabase> {
  const adminUrl = testDatabaseAdminUrl();
  // Generated hex only, so the quoted identifier needs no further escaping.
  const name = `${TEST_DATABASE_PREFIX}${randomBytes(8).toString('hex')}`;
  await withAdminClient(adminUrl, `CREATE DATABASE "${name}"`);

  const url = new URL(adminUrl);
  url.pathname = `/${name}`;
  const client = createDb({
    connectionString: url.toString(),
    applicationName: 'classflow-integration-test',
  });

  return {
    ...client,
    name,
    async destroy() {
      await client.pool.end();
      await withAdminClient(adminUrl, `DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
    },
  };
}

interface MigrationJournal {
  entries: { tag: string }[];
}

/**
 * Applies the committed migrations. With `through`, stops after that migration
 * tag so upgrade tests can insert data shaped like an older schema first; a
 * later call without `through` applies the remainder, as a deployment would.
 */
export async function migrateTestDatabase(
  db: Database,
  options: { through?: string } = {},
): Promise<void> {
  if (!options.through) {
    await migrate(db, { migrationsFolder });
    return;
  }

  const journalText = await readFile(path.join(migrationsFolder, 'meta', '_journal.json'), 'utf8');
  const journal = JSON.parse(journalText) as MigrationJournal;
  const last = journal.entries.findIndex((entry) => entry.tag === options.through);
  if (last === -1) throw new Error(`Unknown migration tag: ${options.through}`);
  const entries = journal.entries.slice(0, last + 1);

  const folder = await mkdtemp(path.join(tmpdir(), 'classflow-migrations-'));
  try {
    await mkdir(path.join(folder, 'meta'));
    await writeFile(path.join(folder, 'meta', '_journal.json'), JSON.stringify({ ...journal, entries }));
    for (const { tag } of entries) {
      await copyFile(path.join(migrationsFolder, `${tag}.sql`), path.join(folder, `${tag}.sql`));
    }
    await migrate(db, { migrationsFolder: folder });
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
}
