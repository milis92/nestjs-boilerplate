import { Injectable } from '@nestjs/common';
import { seconds } from '@nestjs/throttler';
import { ThrottlerStorage } from '@nestjs/throttler/dist/throttler-storage.interface';

/**
 * Health check indicator for the rate limiting system.
 *
 * Used by the application's health check endpoint to verify that
 * the Redis-backed throttler storage is operational and can track
 * request counts across application instances.
 */
@Injectable()
export class RateLimiterHealthCheckIndicator {
  constructor(private readonly throttler: ThrottlerStorage) {}

  /**
   * Checks if the rate limiter storage is healthy by attempting an increment operation.
   *
   * The check performs a test increment on a dedicated health check key.
   * If the operation succeeds, the Redis connection is considered operational.
   *
   * @returns `true` if the rate limiter storage is healthy, `false` if the operation fails
   */
  async isHealthy(): Promise<boolean> {
    return await this.throttler
      .increment('health', seconds(0), 1000, 0, 'health')
      .catch(() => false)
      .then(() => true);
  }
}
