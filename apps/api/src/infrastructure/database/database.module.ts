import { createDb, type Database, type DbClient } from '@classflow/db';
import { Injectable, Module, type OnApplicationShutdown } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema.js';
import { DATABASE } from './database.token.js';

@Injectable()
class DatabaseConnection implements OnApplicationShutdown {
  readonly client: DbClient;

  constructor(config: ConfigService<Env, true>) {
    this.client = createDb({
      connectionString: config.get('DATABASE_URL', { infer: true }),
      maxConnections: config.get('DATABASE_POOL_MAX', { infer: true }),
      logQueries: config.get('DATABASE_LOG_QUERIES', { infer: true }),
      applicationName: 'classflow-api',
    });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.pool.end();
  }
}

@Module({
  imports: [ConfigModule],
  providers: [
    DatabaseConnection,
    {
      provide: DATABASE,
      inject: [DatabaseConnection],
      useFactory: (connection: DatabaseConnection): Database =>
        connection.client.db,
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
