import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';
import { DATABASE } from '../src/infrastructure/database/database.token.js';

// HTTP-layer e2e: Postgres is stubbed so these run without Docker.
// Tests that exercise real queries belong in a separate integration suite.
const databaseStub = {
  execute: vi.fn().mockResolvedValue({ rows: [] }),
};

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DATABASE)
      .useValue(databaseStub)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('GET /api/health', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
        expect(res.body.details.database.status).toBe('up');
      });
  });

  it('sets security headers', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect('x-content-type-options', 'nosniff');
  });

  it('allows the web app origin via CORS', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .set('Origin', 'http://localhost:3000')
      .expect('access-control-allow-origin', 'http://localhost:3000');
  });

  it('rejects protected routes without an access token', () => {
    return request(app.getHttpServer())
      .get('/api/v1/me')
      .expect(401)
      .expect('www-authenticate', /^Bearer/);
  });

  it('rejects a malformed access token', () => {
    return request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', 'Bearer not-a-jwt')
      .expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});
