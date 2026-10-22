import { Test } from '@nestjs/testing';
import { DATABASE } from '../../../infrastructure/database/database.token.js';
import { EmailAlreadyExistsError } from './user-persistence.errors.js';
import { UsersRepository } from './user.repository.js';

describe('UsersRepository persistence errors', () => {
  let repository: UsersRepository;
  const returning = vi.fn();
  const input = {
    auth0Subject: 'auth0|test',
    name: 'Ana',
    email: 'ana@example.com',
    status: 'active' as const,
  };

  beforeEach(async () => {
    returning.mockReset();
    const module = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: DATABASE,
          useValue: {
            insert: () => ({
              values: () => ({ onConflictDoNothing: () => ({ returning }) }),
            }),
          },
        },
      ],
    }).compile();
    repository = module.get(UsersRepository);
  });

  it.each([false, true])(
    'reports email uniqueness without registration semantics (wrapped: %s)',
    async (wrapped) => {
      const driverError = Object.assign(new Error('Driver detail'), {
        code: '23505',
        constraint: 'users_email_unique',
      });
      returning.mockRejectedValue(
        wrapped
          ? new Error('Query failed', { cause: driverError })
          : driverError,
      );
      await expect(repository.create(input)).rejects.toBeInstanceOf(
        EmailAlreadyExistsError,
      );
    },
  );

  it.each([
    new Error('Connection unavailable'),
    Object.assign(new Error('Different unique constraint'), {
      code: '23505',
      constraint: 'users_pkey',
    }),
  ])(
    'propagates unexpected persistence failures unchanged: %s',
    async (error) => {
      returning.mockRejectedValue(error);
      await expect(repository.create(input)).rejects.toBe(error);
    },
  );
});
