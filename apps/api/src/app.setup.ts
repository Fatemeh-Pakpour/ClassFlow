import { type INestApplication, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import type { Env } from './config/env.schema.js';

/**
 * HTTP-level app configuration, shared by main.ts and the e2e tests so both
 * exercise the same routes (/api/v1/...), headers and CORS policy.
 */
export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService<Env, true>);

  app.use(helmet());
  app.enableCors({
    origin: config.get('CORS_ORIGINS', { infer: true }),
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Lets onModuleDestroy/onApplicationShutdown run on SIGTERM, so connections
  // (database, RabbitMQ) close cleanly when a container is stopped.
  app.enableShutdownHooks();
}
