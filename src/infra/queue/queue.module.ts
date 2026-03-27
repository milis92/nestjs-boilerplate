import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DiscoveryModule } from '@nestjs/core';
import redisConfig, { RedisConfig } from '@/config/redis.config';
import { RedisOptions } from 'ioredis/built/redis/RedisOptions';
import { QueueHealthCheckIndicator } from '@/infra/queue/queue.health';
import { BullBoardDiscovery } from '@/infra/queue/bull-board-discovery';
import { BullBoardModule as NestBullBoard } from '@bull-board/nestjs/dist/bull-board.module';
import { ExpressAdapter } from '@bull-board/express';
import { ConditionalModule } from '@nestjs/config';
import { Environment } from '@/config/app.config';

/** Creates Redis connection options for the BullMQ from the application's Redis config. */
const redisJobQueClient = (redis: RedisConfig): RedisOptions => ({
  host: redis.host,
  port: redis.port,
  password: redis.password,
  connectionName: 'queue',
  db: redis.queueDatabase,
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
 * Module that provides distributed job queue processing via BullMQ.
 *
 * ### How It Works
 *
 * BullMQ uses Redis as a message broker for reliable, distributed job
 * processing. Jobs are enqueued by producers and picked up by worker
 * consumers, with automatic retries, backoff, and dead-letter support
 * built into the BullMQ library.
 *
 * ### Redis Connection
 *
 * The queue uses a dedicated Redis database (`REDIS_QUEUE_DB`, default `2`)
 * to isolate job data from the cache and rate limiter stores. The connection
 * is configured with lazy connect and automatic reconnection.
 *
 * ### Usage
 *
 * Domain modules register their own queues and processors using
 * `BullModule.registerQueue()` and `@Processor()` decorators. This module
 * only provides the root BullMQ connection — individual queues are defined
 * at the feature level.
 *
 * @example
 * ```typescript
 * // In a domain module
 * @Module({
 *   imports: [BullModule.registerQueue({ name: 'my-queue' })],
 *   providers: [MyQueueProducer, MyQueueProcessor],
 * })
 * export class MyFeatureModule {}
 * ```
 */
@Global()
@Module({
  imports: [
    DiscoveryModule,
    BullModule.forRootAsync({
      ...redisConfig.asProvider(),
      useFactory: (config: RedisConfig) => ({
        connection: redisJobQueClient(config),
      }),
    }),
    BullModule.registerQueue({ name: 'health' }),
    ConditionalModule.registerWhen(
      NestBullBoard.forRoot({
        route: '/admin/queues',
        adapter: ExpressAdapter,
      }),
      (env: NodeJS.ProcessEnv) =>
        env['NODE_ENV'] !== Environment.Production,
    ),
  ],
  providers: [QueueHealthCheckIndicator, BullBoardDiscovery],
  exports: [QueueHealthCheckIndicator],
})
export class QueueModule {}
