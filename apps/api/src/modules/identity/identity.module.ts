import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { MeController } from './me.controller.js';

@Module({
  controllers: [MeController],
  // Registered through DI (not app.useGlobalGuards) so it also applies in e2e tests.
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class IdentityModule {}
