import { Global, Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import KeyvRedis, { createClient } from '@keyv/redis';
import { Keyv } from 'keyv';
import { CacheableMemory } from 'cacheable';
import cacheConfig, { CacheConfig } from '@/config/cache.config';
import redisConfig, { RedisConfig } from '@/config/redis.config';
import { CacheHealthCheckIndicator } from '@/infra/cache/cache.health';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HttpCacheInterceptor } from '@/infra/cache/cache.interceptor';

/**
 * Creates a Redis client configured for caching operations.
 *
 * @param redisConfig - The Redis configuration containing connection details
 * @returns A configured Redis client instance for the cache store
 */
const redisCacheClient = (redisConfig: RedisConfig) =>
  createClient({
    name: 'cache',
    database: redisConfig.cacheDatabase,
    socket: redisConfig.tls
      ? {
          host: redisConfig.host,
          port: redisConfig.port,
          tls: true,
          ca: redisConfig.ca,
          key: redisConfig.key,
          cert: redisConfig.cert,
        }
      : {
          host: redisConfig.host,
          port: redisConfig.port,
          tls: false,
        },
    password: redisConfig.password,
  });

/**
 * Module that provides a two-level caching system for the application.
 *
 * ### How Caching Works
 *
 * The cache uses a tiered architecture with two storage levels:
 *
 * **Level 1 - In-Memory Cache (CacheableMemory):**
 * - Fast, local memory storage using LRU (Least Recently Used) eviction
 * - Provides sub-millisecond response times for frequently accessed data
 * - Limited by configured `lruSize` to prevent memory exhaustion
 * - Data is lost on application restart
 *
 * **Level 2 - Redis Cache:**
 * - Distributed, persistent storage shared across all application instances
 * - Slower than in-memory but survives application restarts
 * - Enables cache sharing in multi-instance deployments
 *
 * ### Cache Lookup Flow
 *
 * When a cached value is requested:
 * 1. First, the in-memory cache (L1) is checked
 * 2. If not found, the Redis cache (L2) is checked
 * 3. If found in L2, the value is returned (and may be promoted to L1)
 * 4. If not found in either level, the original data source is queried
 *
 * ### Usage
 *
 * Caching is automatically applied to GET requests via `HttpCacheInterceptor`.
 * Use the `@NoCache()` decorator to disable caching for specific routes.
 *
 * @example
 * ```typescript
 * // Caching is enabled by default for GET requests
 * @Get('data')
 * getData() {
 *   return this.service.getData();
 * }
 *
 * // Disable caching for a specific route
 * @Get('realtime')
 * @NoCache()
 * getRealtimeData() {
 *   return this.service.getRealtimeData();
 * }
 * ```
 */
@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [
        ConfigModule.forFeature(cacheConfig),
        ConfigModule.forFeature(redisConfig),
      ],
      inject: [cacheConfig.KEY, redisConfig.KEY],
      useFactory: (
        cacheConfig: CacheConfig,
        redisConfig: RedisConfig,
      ) => ({
        stores: [
          new Keyv({
            store: new CacheableMemory({
              ttl: cacheConfig.ttl,
              lruSize: cacheConfig.lruSize,
            }),
          }),
          new KeyvRedis(redisCacheClient(redisConfig)),
        ],
      }),
    }),
  ],
  providers: [
    CacheHealthCheckIndicator,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpCacheInterceptor,
    },
  ],
  exports: [NestCacheModule, CacheHealthCheckIndicator],
})
export class CacheModule {}
