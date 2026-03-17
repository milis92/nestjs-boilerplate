import { Injectable } from '@nestjs/common';
import { Cache } from '@nestjs/cache-manager';

import {
  type HealthIndicator,
  RegisterHealthIndicator,
} from '@/tools/health/health.indicator';

/**
 * Health check indicator for the caching system.
 *
 * Used by the application's health check endpoint to verify that
 * the cache infrastructure (both in-memory and Redis) is operational.
 */
@Injectable()
@RegisterHealthIndicator('cache')
export class CacheHealthCheckIndicator implements HealthIndicator {
  constructor(private readonly cacheManager: Cache) {}

  /** Returns true if the Redis cache store responds to a ping. */
  async isHealthy(): Promise<boolean> {
    return await this.cacheManager
      .set('health', true)
      .then(() => true)
      .catch(() => false);
  }
}
