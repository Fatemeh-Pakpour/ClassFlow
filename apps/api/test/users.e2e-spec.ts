import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { DATABASE } from '../src/infrastructure/database/database.token.js';
import { UserEmailConflictError } from '../src/modules/users/application/user-registration.errors.js';
import { UsersRepository } from '../src/modules/users/infrastructure/user.repository.js';

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
          payload: { sub: 'auth0|test-user' },
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
  status: 'pending_verification',
  email_verified_at: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('User registration HTTP boundary', () => {
  let app: INestApplication;
  const repository = {
    findByAuth0Subject: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
  };

  beforeEach(async () => {
    repository.findByAuth0Subject.mockReset().mockResolvedValue(undefined);
    repository.findByEmail.mockReset().mockResolvedValue(undefined);
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
      .send({ name: 'Ana', email: 'ana@example.com' })
      .expect(401);
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.findByEmail).not.toHaveBeenCalled();
  });

  it('uses verified identity, trims profile fields and assigns pending status', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', 'Bearer test-token')
      .send({ name: ' Ana ', email: ' ana@example.com ' })
      .expect(200);

    expect(repository.create).toHaveBeenCalledExactlyOnceWith({
      auth0Subject: 'auth0|test-user',
      name: 'Ana',
      email: 'ana@example.com',
      status: 'pending_verification',
    });
    expect(response.body).toEqual({
      id: storedUser.id,
      name: 'Ana',
      email: 'ana@example.com',
      status: 'pending_verification',
      createdAt: storedUser.createdAt.toISOString(),
      updatedAt: storedUser.updatedAt.toISOString(),
    });
  });

  it.each([
    { name: 'Ana', email: 'invalid' },
    { name: ' ', email: 'ana@example.com' },
    { name: 'Ana' },
    { name: 'Ana', email: 'ana@example.com', auth0Subject: 'auth0|victim' },
    { name: 'Ana', email: 'ana@example.com', status: 'active' },
    { name: 'Ana', email: 'ana@example.com', id: 'chosen-id' },
  ])('rejects invalid or privileged input: %j', async (body) => {
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', 'Bearer test-token')
      .send(body)
      .expect(400);
    expect(repository.findByAuth0Subject).not.toHaveBeenCalled();
    expect(repository.findByEmail).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('returns the existing user without changing their profile', async () => {
    repository.findByAuth0Subject.mockResolvedValue(storedUser);
    const response = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'Different', email: 'different@example.com' })
      .expect(200);
    expect(response.body.name).toBe('Ana');
    expect(repository.findByEmail).not.toHaveBeenCalled();
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
      .send({ name: 'Ana', email: 'ana@example.com' })
      .expect(200);
    expect(repository.findByAuth0Subject).toHaveBeenCalledTimes(2);
  });

  it('rejects an email collision found before insertion', async () => {
    repository.findByEmail.mockResolvedValue({
      ...storedUser,
      auth0Subject: 'auth0|other',
    });
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'Ana', email: 'ana@example.com' })
      .expect(409);
    expect(repository.findByEmail).toHaveBeenCalledWith('ana@example.com');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('does not link an email that collides during insertion', async () => {
    repository.create.mockRejectedValue(new UserEmailConflictError());
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'Ana', email: 'ana@example.com' })
      .expect(409);
  });

  it('returns a generic 500 for unexpected persistence failures', async () => {
    repository.create.mockRejectedValue(
      new Error('Private database connection details'),
    );
    const response = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'Ana', email: 'ana@example.com' })
      .expect(500);
    expect(response.body.message).toBe('Internal server error');
    expect(JSON.stringify(response.body)).not.toContain('Private database');
  });
});
