import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

// Unversioned on purpose: probes (Docker, load balancers) hit a stable /api/health.
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly health: HealthCheckService) {}

  @Get()
  @HealthCheck()
  check() {
    // Add indicators here as dependencies are wired up (database, RabbitMQ).
    return this.health.check([]);
  }
}
