import { Controller, Get } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  HealthIndicatorService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { ApiExcludeController } from '@nestjs/swagger';

import { AuthAllowAnonymous } from '@/infra/auth/auth.decorators';
import { HealthDiscoveryService } from '@/tools/health/health-discovery.service';

@ApiExcludeController(true)
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly healthDiscovery: HealthDiscoveryService,

    private readonly disk: DiskHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @AuthAllowAnonymous()
  @Get()
  @HealthCheck({
    noCache: true,
    swaggerDocumentation: true,
  })
  check() {
    return this.health.check([
      // Enable if you want disk health check
      // () =>
      //   this.disk.checkStorage('storage', {
      //     path: '/',
      //     thresholdPercent: 0.5,
      //   }),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      ...[...this.healthDiscovery.indicators].map(
        ([name, indicator]) =>
          () =>
            this.checkService(name, () => indicator.isHealthy()),
      ),
    ]);
  }

  async checkService(
    name: string,
    checkFunction: () => Promise<boolean>,
  ) {
    const indicator = this.healthIndicatorService.check(name);
    if (await checkFunction()) {
      return indicator.up();
    } else {
      return indicator.down();
    }
  }
}
