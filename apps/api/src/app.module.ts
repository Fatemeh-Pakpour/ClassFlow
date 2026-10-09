import { createDb } from '@classflow/db';
import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { DrizzleModule } from '@nestjs/drizzle';
import { envSchema, type Env } from './config/env.schema.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: envSchema,
    }),
    // Global: inject anywhere with @InjectDrizzle(). The pool is closed on shutdown.
    // The instance comes from @classflow/db so the api and worker share one
    // setup (schema, snake_case casing, pool settings).
    DrizzleModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        db: createDb({
          connectionString: config.get('DATABASE_URL', { infer: true }),
          maxConnections: config.get('DATABASE_POOL_MAX', { infer: true }),
          logQueries: config.get('DATABASE_LOG_QUERIES', { infer: true }),
          applicationName: 'classflow-api',
        }).db,
      }),
    }),
    HealthModule,
  ],
  providers: [
    // Registered through DI (not app.useGlobalPipes) so it also applies in e2e tests.
    { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
  ],
})
export class AppModule {}
