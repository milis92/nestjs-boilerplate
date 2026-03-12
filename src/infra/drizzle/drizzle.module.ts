import {
  Global,
  Inject,
  Module,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Cache } from '@nestjs/cache-manager';
import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import databaseConfig, {
  DatabaseConfig,
} from '@/config/database.config';
import { DrizzleHealthCheckIndicator } from './drizzle.health';
import { DrizzleCacheStore } from './drizzle-cache.store';

import * as schema from './schema';
import { relations } from './relations';

/** Drizzle ORM database instance with schema and relations. */
export type DrizzleDatabase = NodePgDatabase<
  typeof schema,
  typeof relations
>;

export const DRIZZLE_DB = Symbol('DRIZZLE_DB');
export const InjectDrizzle = () => Inject(DRIZZLE_DB);

/** Creates a PostgreSQL connection pool from the database config. */
function createPool(config: DatabaseConfig): Pool {
  return new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl
      ? { rejectUnauthorized: config.rejectUnauthorized }
      : false,
  });
}

/**
 * Module that provides the Drizzle ORM database instance to the application.
 *
 * ### What It Provides
 *
 * - **DrizzleDatabase** — a fully typed Drizzle ORM instance with schema,
 *   relations, and query-level caching. Inject via `@InjectDrizzle()`.
 * - **DrizzleHealthCheckIndicator** — health check that verifies PostgreSQL connectivity.
 *
 * ### Query Caching
 *
 * All Drizzle queries are automatically cached via {@link DrizzleCacheStore},
 * backed by the application's L1/L2 cache (in-memory + Redis). Cache entries
 * are invalidated automatically when tables are mutated.
 *
 * ### Lifecycle
 *
 * The PostgreSQL connection pool is gracefully closed on module destroy.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forFeature(databaseConfig),
  ],
  providers: [
    {
      provide: Pool,
      inject: [databaseConfig.KEY],
      useFactory: (config: DatabaseConfig) => createPool(config),
    },
    {
      provide: DRIZZLE_DB,
      inject: [Pool, Cache],
      useFactory: (
        pool: Pool,
        cacheManager: Cache,
      ): DrizzleDatabase =>
        drizzle({
          client: pool,
          schema,
          relations,
          cache: new DrizzleCacheStore(cacheManager),
        }),
    },
    DrizzleHealthCheckIndicator,
  ],
  exports: [DRIZZLE_DB, DrizzleHealthCheckIndicator],
})
export class DrizzleModule implements OnModuleDestroy {
  constructor(private readonly pool: Pool) {}
  async onModuleDestroy() {
    await this.pool.end();
  }
}
