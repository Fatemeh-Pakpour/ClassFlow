import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';
import { getDrizzleToken } from '@nestjs/drizzle';

// HTTP-layer e2e: Postgres is stubbed so these run without Docker.
// Tests that exercise real queries belong in a separate integration suite.
const fakeDb = {
  execute: async () => ({ rows: [] }),
  // DrizzleModule closes db.$client on shutdown.
  $client: { end: async () => {} },
};

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getDrizzleToken())
      .useValue(fakeDb)
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

  afterEach(async () => {
    await app.close();
  });
});
