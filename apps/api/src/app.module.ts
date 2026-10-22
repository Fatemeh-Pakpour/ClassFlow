import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { DatabaseModule } from './infrastructure/database/database.module.js';
import { IdentityModule } from './modules/identity/identity.module.js';
import { envSchema } from './infrastructure/config/env.schema.js';
import { HealthModule } from './infrastructure/health/health.module.js';
import { UserModule } from './modules/users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: envSchema,
    }),
    DatabaseModule,
    IdentityModule,
    HealthModule,
    UserModule,
  ],
  providers: [
    // Registered through DI (not app.useGlobalPipes) so it also applies in e2e tests.
    { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
  ],
})
export class AppModule {}
