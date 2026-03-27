import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/infra/drizzle/drizzle.module';
import { RateLimiterModule } from '@/infra/rate_limiter/rate_limiter.module';
import { CacheModule } from '@/infra/cache/cache.module';
import { AuthModule } from '@/infra/auth/auth.module';
import { GraphqlModule } from '@/infra/graphql/graphql.module';
import { QueueModule } from '@/infra/queue/queue.module';
import { LlmModule } from '@/infra/llm/llm.module';
import { UploadModule } from '@/infra/upload/upload.module';

/**
 * Root infrastructure module that aggregates all cross-cutting concerns.
 *
 * Imports and re-exports the global infrastructure modules so that domain
 * modules only need to depend on their own feature modules — database access,
 * caching, rate limiting, authentication, and GraphQL are all available
 * application-wide via the modules registered here.
 *
 * ### Provided Infrastructure
 *
 * - **DrizzleModule** — PostgreSQL connection pool and Drizzle ORM instance
 * - **CacheModule** — Two-level cache (in-memory L1 + Redis L2)
 * - **RateLimiterModule** — Distributed rate limiting via Redis
 * - **AuthModule** — BetterAuth authentication with global guard
 * - **GraphqlModule** — Apollo Server GraphQL endpoint
 * - **QueueModule** — BullMQ job queue backed by Redis
 * - **LlmModule** — Vercel AI SDK wrapper for LLM-based object generation
 * - **UploadModule** — Multer file upload with disk health check
 */
@Module({
  imports: [
    DrizzleModule,
    RateLimiterModule,
    CacheModule,
    AuthModule,
    GraphqlModule,
    QueueModule,
    LlmModule,
    UploadModule,
  ],
})
export class InfraModule {}
