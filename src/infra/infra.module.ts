import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/infra/drizzle/drizzle.module';
import { RateLimiterModule } from '@/infra/rate_limiter/rate_limiter.module';
import { CacheModule } from '@/infra/cache/cache.module';
import { AuthModule } from '@/infra/auth/auth.module';
import { GraphqlModule } from '@/infra/graphql/graphql.module';

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
 */
@Module({
  imports: [
    DrizzleModule,
    RateLimiterModule,
    CacheModule,
    AuthModule,
    GraphqlModule,
  ],
})
export class InfraModule {}
