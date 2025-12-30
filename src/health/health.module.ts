import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from '@/health/health.controller';
import { CacheModule } from '@/infra/cache/cache.module';
import { RateLimiterModule } from '@/infra/rate_limiter/rate_limiter.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { GraphqlModule } from '@/infra/graphql/graphql.module';

/**
 * Module that provides health check endpoints for monitoring application status.
 *
 * ### Purpose
 *
 * This module exposes health check endpoints that can be used by load balancers,
 * orchestration systems (like Kubernetes), and monitoring tools to verify that
 * the application and its dependencies are functioning correctly.
 *
 * ### Health Checks Included
 *
 * The module imports health indicators from various infrastructure modules:

 * ### Terminus Integration
 *
 * Uses `@nestjs/terminus` with pretty error logging for clear, readable
 * health check failure messages during debugging and monitoring.
 */
@Module({
  imports: [
    TerminusModule.forRoot({
      errorLogStyle: 'pretty',
    }),
    CacheModule,
    RateLimiterModule,
    DatabaseModule,
    GraphqlModule,
  ],
  controllers: [HealthController],
})
export class HealthModule {}
