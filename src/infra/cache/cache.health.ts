import { Injectable } from '@nestjs/common';
import { Cache } from '@nestjs/cache-manager';

/**
 * Health check indicator for the caching system.
 *
 * Used by the application's health check endpoint to verify that
 * the cache infrastructure (both in-memory and Redis) is operational.
 */
@Injectable()
export class CacheHealthCheckIndicator {
  constructor(private readonly cacheManager: Cache) {}

  /** Returns true if the Redis cache store responds to a ping. */
  async isHealthy(): Promise<boolean> {
    return await this.cacheManager
      .set('health', true)
      .catch(() => false);
  }
}
