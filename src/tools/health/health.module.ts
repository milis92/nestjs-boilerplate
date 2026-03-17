import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';

import { HealthController } from '@/tools/health/health.controller';
import { HealthDiscoveryService } from '@/tools/health/health-discovery.service';

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
 * Health indicators are auto-discovered at startup. Any provider decorated with
 * `@RegisterHealthIndicator('name')` and implementing the `HealthIndicator`
 * interface will be included automatically.
 *
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
    DiscoveryModule,
  ],
  providers: [HealthDiscoveryService],
  controllers: [HealthController],
})
export class HealthModule {}
