import { Controller, Get } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  HealthIndicatorService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { CacheHealthCheckIndicator } from '@/infra/cache/cache.health';
import { RateLimiterHealthCheckIndicator } from '@/infra/rate_limiter/rate_limiter.health';
import { DrizzleHealthCheckIndicator } from '@/infra/drizzle/drizzle.health';
import { GraphqlHealthCheckIndicator } from '@/infra/graphql/graphql.health';
import { AuthHealthCheckIndicator } from '@/infra/auth/auth.health';
import { AuthAllowAnonymous } from '@/infra/auth/auth.decorators';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController(true)
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly healthIndicatorService: HealthIndicatorService,

    private readonly http: HttpHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly memory: MemoryHealthIndicator,

    private readonly cache: CacheHealthCheckIndicator,
    private readonly rateLimiter: RateLimiterHealthCheckIndicator,
    private readonly database: DrizzleHealthCheckIndicator,
    private readonly graphql: GraphqlHealthCheckIndicator,
    private readonly auth: AuthHealthCheckIndicator,
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
      () => this.checkService('cache', () => this.cache.isHealthy()),
      () =>
        this.checkService('throttler', () =>
          this.rateLimiter.isHealthy(),
        ),
      () =>
        this.checkService('database', () =>
          this.database.isHealthy(),
        ),
      () =>
        this.checkService('graphql', () => this.graphql.isHealthy()),
      () => this.checkService('auth', () => this.auth.isHealthy()),
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
