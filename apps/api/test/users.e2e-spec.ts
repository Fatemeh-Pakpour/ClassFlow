import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { DATABASE } from '../src/infrastructure/database/database.token.js';
import { UserEmailConflictError } from '../src/modules/users/application/user-registration.errors.js';
import { UsersRepository } from '../src/modules/users/infrastructure/user.repository.js';

let tokenClaims: Record<string, unknown>;

// Exercise the real global guard and pipe with a controlled token verifier.
// This does not establish live Auth0 verification or PostgreSQL correctness.
vi.mock('express-oauth2-jwt-bearer', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('express-oauth2-jwt-bearer')>();
  return {
    ...original,
    auth:
      () =>
      (
        req: import('express').Request,
        _res: import('express').Response,
        next: import('express').NextFunction,
      ) => {
        if (req.headers.authorization !== 'Bearer test-token') {
          next(new original.UnauthorizedError());
          return;
        }
        req.auth = {
          header: { alg: 'RS256' },
          payload: tokenClaims,
          token: 'test-token',
        };
        next();
      },
  };
});

const storedUser = {
  id: '01900000-0000-7000-8000-000000000001',
  auth0Subject: 'auth0|test-user',
  email: 'ana@example.com',
  name: 'Ana',
  status: 'active',
  email_verified_at: new Date('2026-01-01T00:00:00Z'),
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('User registration HTTP boundary', () => {
  let app: INestApplication;
  const repository = {
    findByAuth0Subject: vi.fn(),
    create: vi.fn(),
  };

  beforeEach(async () => {
    tokenClaims = {
      sub: 'auth0|test-user',
      'https://classflow.app/email': ' ana@example.com ',
      'https://classflow.app/email_verified': true,
    };
    repository.findByAuth0Subject.mockReset().mockResolvedValue(undefined);
    repository.create.mockReset().mockResolvedValue(storedUser);
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DATABASE)
      .useValue({ execute: vi.fn() })
      .overrideProvider(UsersRepository)
      .useValue(repository)
      .compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects anonymous registration before calling persistence', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .send({ name: 'Ana' })
      .expect(401);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('uses verified subject and email, trims name and records verification', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', 'Bearer test-token')
      .send({ name: ' Ana ' })
      .expect(200);

    expect(repository.create).toHaveBeenCalledExactlyOnceWith({
      auth0Subject: 'auth0|test-user',
      name: 'Ana',
      email: 'ana@example.com',
      status: 'active',
      email_verified_at: expect.any(Date),
    });
    expect(response.body).toEqual({
      id: storedUser.id,
      name: 'Ana',
      email: 'ana@example.com',
      status: 'active',
      createdAt: storedUser.createdAt.toISOString(),
      updatedAt: storedUser.updatedAt.toISOString(),
    });
  });

  it.each([
    {},
    { name: ' ' },
    { name: 'Ana', email: 'victim@example.com' },
    { name: 'Ana', emailVerified: true },
    { name: 'Ana', auth0Subject: 'auth0|victim' },
    { name: 'Ana', status: 'active' },
    { name: 'Ana', id: 'chosen-id' },
  ])('rejects invalid or privileged input: %j', async (body) => {
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', 'Bearer test-token')
      .send(body)
      .expect(400);
    expect(repository.findByAuth0Subject).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('returns the existing user without changing their profile', async () => {
    repository.findByAuth0Subject.mockResolvedValue(storedUser);
    const response = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'Different' })
      .expect(200);
    expect(response.body.name).toBe('Ana');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('resolves the user if another request won the insert race', async () => {
    repository.findByAuth0Subject
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(storedUser);
    repository.create.mockResolvedValue(undefined);
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'Ana' })
      .expect(200);
    expect(repository.findByAuth0Subject).toHaveBeenCalledTimes(2);
  });

  it('does not link an email that collides during insertion', async () => {
    repository.create.mockRejectedValue(new UserEmailConflictError());
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'Ana' })
      .expect(409);
  });

  it('returns a generic 500 for unexpected persistence failures', async () => {
    repository.create.mockRejectedValue(
      new Error('Private database connection details'),
    );
    const response = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'Ana' })
      .expect(500);
    expect(response.body.message).toBe('Internal server error');
    expect(JSON.stringify(response.body)).not.toContain('Private database');
  });
  it.each([
    {},
    { 'https://classflow.app/email': 'ana@example.com' },
    {
      'https://classflow.app/email': 'ana@example.com',
      'https://classflow.app/email_verified': false,
    },
    {
      'https://classflow.app/email': 'ana@example.com',
      'https://classflow.app/email_verified': 'true',
    },
    {
      'https://classflow.app/email': 'invalid',
      'https://classflow.app/email_verified': true,
    },
    { 'https://classflow.app/email_verified': true },
    { email: 'ana@example.com', email_verified: true },
  ])(
    'rejects missing or invalid verified-email claims before database access: %j',
    async (claims) => {
      tokenClaims = { sub: 'auth0|test-user', ...claims };
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', 'Bearer test-token')
        .send({ name: 'Ana' })
        .expect(403);
      expect(repository.findByAuth0Subject).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
    },
  );

  it('does not enforce verified email on unrelated authenticated routes', async () => {
    tokenClaims = { sub: 'auth0|test-user' };
    await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', 'Bearer test-token')
      .expect(200);
  });

  it('rejects a token without a subject on the registration route', async () => {
    delete tokenClaims.sub;
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'Ana' })
      .expect(401);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('recovers when an email conflict was created by a same-subject request', async () => {
    repository.create.mockRejectedValue(new UserEmailConflictError());
    repository.findByAuth0Subject
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(storedUser);
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'Ana' })
      .expect(200);
    expect(repository.findByAuth0Subject).toHaveBeenCalledTimes(2);
  });
});
