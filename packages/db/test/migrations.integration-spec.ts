import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { migrationsFolder } from '../src/migrations.ts';
import { createTestDatabase, migrateTestDatabase, type TestDatabase } from '../src/testing.ts';

describe('committed migrations', () => {
  let testDb: TestDatabase;

  beforeEach(async () => {
    testDb = await createTestDatabase();
  });

  afterEach(async () => {
    await testDb?.destroy();
  });

  async function appliedMigrationCount() {
    const result = await testDb.db.execute<{ count: number }>(
      sql`SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations`,
    );
    return result.rows[0]?.count;
  }

  async function selectUsers() {
    const result = await testDb.db.execute(
      sql`SELECT id, email, name, status, auth0_subject, email_verified_at, updated_at FROM users ORDER BY email`,
    );
    return result.rows;
  }

  it('apply to an empty database and change nothing when re-run', async () => {
    const journal = JSON.parse(
      await readFile(path.join(migrationsFolder, 'meta', '_journal.json'), 'utf8'),
    ) as { entries: unknown[] };

    await migrateTestDatabase(testDb.db);
    expect(await appliedMigrationCount()).toBe(journal.entries.length);

    await testDb.db.execute(
      sql`INSERT INTO users (email, name, status) VALUES ('ana@example.com', 'Ana', 'active')`,
    );
    const before = await selectUsers();

    await migrateTestDatabase(testDb.db);

    expect(await appliedMigrationCount()).toBe(journal.entries.length);
    expect(await selectUsers()).toEqual(before);
  });

  it('preserve existing users through the status, length and Auth0 subject changes', async () => {
    // Shapes of the users table before 0001 (no status) and before 0002 (old enum).
    await migrateTestDatabase(testDb.db, { through: '0000_init' });
    const initial = await testDb.db.execute<{ id: string }>(
      sql`INSERT INTO users (email, name) VALUES ('Legacy@Example.com', 'Legacy') RETURNING id`,
    );
    await migrateTestDatabase(testDb.db, { through: '0001_square_husk' });
    await testDb.db.execute(
      sql`INSERT INTO users (email, name, status) VALUES ('suspended@example.com', 'Suspended', 'suspended')`,
    );

    await migrateTestDatabase(testDb.db);

    expect(await selectUsers()).toMatchObject([
      {
        id: initial.rows[0]?.id,
        email: 'Legacy@Example.com',
        name: 'Legacy',
        status: 'pending_verification',
        auth0_subject: null,
        email_verified_at: null,
      },
      { email: 'suspended@example.com', status: 'suspended', auth0_subject: null },
    ]);
  });
});
