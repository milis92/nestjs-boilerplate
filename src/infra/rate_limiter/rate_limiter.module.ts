import { ThrottlerModule as NestThrottlerModule } from '@nestjs/throttler';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import rateLimiterConfig, {
  RateLimiterConfig,
} from '@/config/rate-limiter.config';
import redisConfig, { RedisConfig } from '@/config/redis.config';
import { RateLimiterHealthCheckIndicator } from '@/infra/rate_limiter/rate_limiter.health';
import { RedisOptions } from 'ioredis/built/redis/RedisOptions';
import { APP_GUARD } from '@nestjs/core';
import { RateLimiterGuard } from '@/infra/rate_limiter/rate_limiter.guard';

const redisRateLimiterClient = (
  redis: RedisConfig,
): RedisOptions => ({
  host: redis.host,
  port: redis.port,
  password: redis.password,
  connectionName: 'rate-limiter',
  db: redis.rateLimiterDatabase,
  tls: redis.tls
    ? {
        rejectUnauthorized: redis.rejectUnauthorized,
        ca: redis.ca,
        key: redis.key,
        cert: redis.cert,
      }
    : undefined,
  enableOfflineQueue: true,
  lazyConnect: true,
  reconnectOnError: () => {
    // Reconnect automatically and send the last command
    return 2;
  },
});

/**
 * Module that provides distributed rate limiting for the application.
 *
 * ### How Rate Limiting Works
 *
 * Rate limiting protects the application from abuse by restricting the number
 * of requests a client can make within a time window. This module uses Redis
 * as a distributed storage backend, ensuring consistent rate limiting across
 * all application instances in a clustered deployment.
 *
 * ### Configuration
 *
 * The rate limiter is configured with three main parameters:
 * - **ttl**: Time window duration for counting requests
 * - **limit**: Maximum number of requests allowed within the time window
 * - **blockDuration**: How long to block a client after exceeding the limit
 *
 * ### Client Identification
 *
 * Clients are identified by their IP address. The `RateLimiterGuard` handles
 * IP extraction, including support for proxy headers (`X-Forwarded-For`, etc.)
 * to correctly identify clients behind load balancers or reverse proxies.
 *
 * ### Usage
 *
 * Rate limiting is applied globally via `RateLimiterGuard` registered as `APP_GUARD`.
 * Use the `@Throttle()` decorator to customize limits for specific routes,
 * or `@SkipThrottle()` to bypass rate limiting entirely.
 *
 * @example
 * ```typescript
 * // Custom rate limit for a specific route
 * @Get('expensive-operation')
 * @Throttle({ default: { limit: 3, ttl: minutes(1) } })
 * expensiveOperation() {
 *   return this.service.performExpensiveOperation();
 * }
 *
 * // Skip rate limiting for a route
 * @Get('health')
 * @SkipThrottle()
 * healthCheck() {
 *   return { status: 'ok' };
 * }
 * ```
 */
@Global()
@Module({
  imports: [
    NestThrottlerModule.forRootAsync({
      imports: [
        ConfigModule.forFeature(rateLimiterConfig),
        ConfigModule.forFeature(redisConfig),
      ],
      inject: [rateLimiterConfig.KEY, redisConfig.KEY],
      useFactory: (
        rateLimiterConfig: RateLimiterConfig,
        redisConfig: RedisConfig,
      ) => ({
        throttlers: [
          {
            ttl: rateLimiterConfig.ttl,
            limit: rateLimiterConfig.limit,
            blockDuration: rateLimiterConfig.blockDuration,
          },
        ],
        storage: new ThrottlerStorageRedisService(
          redisRateLimiterClient(redisConfig),
        ),
      }),
    }),
  ],
  providers: [
    RateLimiterHealthCheckIndicator,
    {
      provide: APP_GUARD,
      useClass: RateLimiterGuard,
    },
  ],
  exports: [NestThrottlerModule, RateLimiterHealthCheckIndicator],
})
export class RateLimiterModule {}
