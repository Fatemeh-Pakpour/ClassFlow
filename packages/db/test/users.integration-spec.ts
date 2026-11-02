import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { userEmailEquals } from '../src/email.ts';
import { users } from '../src/schema/users.ts';
import { createTestDatabase, migrateTestDatabase, type TestDatabase } from '../src/testing.ts';
import { postgresErrorOf } from './postgres-error.ts';

const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('users table constraints', () => {
  let testDb: TestDatabase;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    await migrateTestDatabase(testDb.db);
  });

  afterAll(async () => {
    await testDb?.destroy();
  });

  beforeEach(async () => {
    await testDb.db.execute(sql`TRUNCATE TABLE users`);
  });

  const insertUser = (values: Partial<typeof users.$inferInsert> = {}) =>
    testDb.db
      .insert(users)
      .values({ email: 'ana@example.com', name: 'Ana', status: 'active', ...values })
      .returning();

  it('generates a UUIDv7 identifier and matching creation timestamps', async () => {
    const [user] = await insertUser();

    expect(user?.id).toMatch(UUID_V7);
    expect(user?.createdAt).toBeInstanceOf(Date);
    expect(user?.updatedAt.getTime()).toBe(user?.createdAt.getTime());
    expect(user?.auth0Subject).toBeNull();
    expect(user?.email_verified_at).toBeNull();
  });

  it('treats emails that differ only by case as the same account', async () => {
    await insertUser({ email: 'Ana@Example.com' });

    expect(await postgresErrorOf(insertUser({ email: 'ana@example.com' }))).toMatchObject({
      code: '23505',
      constraint: 'users_email_unique',
    });

    const found = await testDb.db.select().from(users).where(userEmailEquals(' ANA@example.COM '));
    expect(found.map((user) => user.email)).toEqual(['Ana@Example.com']);
  });

  it('allows several users without an Auth0 subject but not a repeated subject', async () => {
    await insertUser({ email: 'one@example.com' });
    await insertUser({ email: 'two@example.com' });
    await insertUser({ email: 'three@example.com', auth0Subject: 'auth0|ana' });

    expect(
      await postgresErrorOf(insertUser({ email: 'four@example.com', auth0Subject: 'auth0|ana' })),
    ).toMatchObject({ code: '23505', constraint: 'users_auth0_subject_unique' });
  });

  // Raw SQL, because the Drizzle types already forbid omitting these values.
  it.each([
    ['email', sql`INSERT INTO users (name, status) VALUES ('Ana', 'active')`],
    ['name', sql`INSERT INTO users (email, status) VALUES ('ana@example.com', 'active')`],
    ['status', sql`INSERT INTO users (email, name) VALUES ('ana@example.com', 'Ana')`],
  ])('requires %s', async (column, statement) => {
    expect(await postgresErrorOf(testDb.db.execute(statement))).toMatchObject({
      code: '23502',
      column,
    });
  });

  it('rejects a status outside the user_status enum', async () => {
    const statement = sql`INSERT INTO users (email, name, status) VALUES ('ana@example.com', 'Ana', 'deleted')`;

    expect(await postgresErrorOf(testDb.db.execute(statement))).toMatchObject({ code: '22P02' });
  });

  it.each([
    ['email', { email: `${'a'.repeat(243)}@example.com` }],
    ['name', { name: 'a'.repeat(101) }],
  ])('rejects an over-length %s', async (_column, values) => {
    expect(await postgresErrorOf(insertUser(values))).toMatchObject({ code: '22001' });
  });

  it('accepts values at the length limits', async () => {
    const email = `${'a'.repeat(242)}@example.com`;
    const [user] = await insertUser({ email, name: 'a'.repeat(100) });

    expect(user?.email).toHaveLength(254);
  });
});
