import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './database.health.js';

// Unversioned on purpose: probes (Docker, load balancers) hit a stable /api/health.
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: DatabaseHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    // Add a RabbitMQ indicator here once the messaging module is wired up.
    return this.health.check([() => this.database.isHealthy('database')]);
  }
}
