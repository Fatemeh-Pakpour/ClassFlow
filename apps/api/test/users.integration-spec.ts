import { sql, users } from '@classflow/db';
import {
  createTestDatabase,
  migrateTestDatabase,
  type TestDatabase,
} from '@classflow/db/testing';
import { UsersService } from '../src/modules/users/application/users.service.js';
import { UserEmailConflictError } from '../src/modules/users/application/user-registration.errors.js';
import { EmailAlreadyExistsError } from '../src/modules/users/infrastructure/user-persistence.errors.js';
import { UsersRepository } from '../src/modules/users/infrastructure/user.repository.js';

// Real PostgreSQL behind the repository and service: proves the constraint
// names, Drizzle error wrapping and race recovery that other suites simulate.
describe('user registration persistence (PostgreSQL)', () => {
  let testDb: TestDatabase;
  let repository: UsersRepository;
  let service: UsersService;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    await migrateTestDatabase(testDb.db);
    repository = new UsersRepository(testDb.db);
    service = new UsersService(repository);
  });

  afterAll(async () => {
    await testDb?.destroy();
  });

  beforeEach(async () => {
    await testDb.db.execute(sql`TRUNCATE TABLE users`);
  });

  const registration = (auth0Subject: string, email: string) => ({
    auth0Subject,
    email,
    emailVerified: true as const,
    name: 'Ana',
  });

  const storedUsers = () => testDb.db.select().from(users);

  it('registers once and returns the stored user on repeat', async () => {
    const first = await service.createUser(
      registration('auth0|ana', ' ana@example.com '),
    );
    const repeat = await service.createUser(
      registration('auth0|ana', 'ana@example.com'),
    );

    expect(first).toMatchObject({
      auth0Subject: 'auth0|ana',
      email: 'ana@example.com',
      status: 'active',
    });
    expect(first.email_verified_at).toBeInstanceOf(Date);
    expect(repeat).toEqual(first);
    expect(await repository.findByAuth0Subject('auth0|ana')).toEqual(first);
  });

  it('reports an email taken with different casing as a persistence conflict', async () => {
    await service.createUser(registration('auth0|ana', 'Ana@Example.com'));

    await expect(
      repository.create({
        auth0Subject: 'auth0|other',
        email: 'ana@example.com',
        name: 'Other',
        status: 'active',
      }),
    ).rejects.toBeInstanceOf(EmailAlreadyExistsError);
    await expect(
      service.createUser(registration('auth0|other', 'ANA@example.com')),
    ).rejects.toBeInstanceOf(UserEmailConflictError);
  });

  it('resolves concurrent registrations of one subject to one user', async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        service.createUser(registration('auth0|ana', 'ana@example.com')),
      ),
    );

    const stored = await storedUsers();
    expect(stored).toHaveLength(1);
    expect(results.map((user) => user.id)).toEqual(
      Array.from({ length: 5 }, () => stored[0]?.id),
    );
  });

  it('lets only one of several subjects claim an email concurrently', async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, (_, index) =>
        service.createUser(
          registration(`auth0|user-${index}`, `${index ? 'ANA' : 'ana'}@example.com`),
        ),
      ),
    );

    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    for (const result of rejected) {
      expect(result.reason).toBeInstanceOf(UserEmailConflictError);
    }
    expect(await storedUsers()).toHaveLength(1);
  });
});
