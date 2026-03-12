import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { Cache } from '@nestjs/cache-manager';
import { Pool } from 'pg';
import authConfig, { AuthConfig } from '@/config/auth.config';
import {
  AUTH_SCHEMA_NAME,
  BETTER_AUTH,
  createBetterAuth,
} from '@/infra/auth/auth.factory';
import { AuthService } from '@/infra/auth/auth.service';
import { AuthGuard } from '@/infra/auth/auth.guard';
import { AuthController } from '@/infra/auth/auth.controller';
import { AuthHealthCheckIndicator } from '@/infra/auth/auth.health';

/** Creates a PostgreSQL connection pool scoped to the `auth` schema for BetterAuth tables. */
export function createAuthPool(config: AuthConfig): Pool {
  return new Pool({
    host: config.databaseHost,
    port: config.databasePort,
    database: config.databaseName,
    user: config.databaseUser,
    password: config.databasePassword,
    ssl: config.databaseSsl
      ? { rejectUnauthorized: config.databaseSslRejectUnauthorized }
      : false,
    options: `-c search_path=${AUTH_SCHEMA_NAME}`,
  });
}

/**
 * Module that provides authentication and session management via BetterAuth.
 *
 * ### How Authentication Works
 *
 * BetterAuth handles user registration, login, and session management using
 * email/password credentials. Sessions are stored in a dedicated PostgreSQL
 * `auth` schema and cached in Redis (via the L1/L2 cache) for fast lookups.
 *
 * ### Global Guard
 *
 * The `AuthGuard` is registered as a global `APP_GUARD`, meaning all routes
 * require a valid session by default. Use `@Public()` to mark specific
 * endpoints as unauthenticated.
 *
 * ### Exports
 *
 * - **AuthService** — programmatic access to the BetterAuth API
 * - **AuthHealthCheckIndicator** — health check for the auth subsystem
 */
@Global()
@Module({
  imports: [ConfigModule.forFeature(authConfig)],
  providers: [
    {
      provide: Pool,
      inject: [authConfig.KEY],
      useFactory: (config: AuthConfig) => createAuthPool(config),
    },
    {
      provide: BETTER_AUTH,
      inject: [Pool, authConfig.KEY, Cache],
      useFactory: (pool: Pool, config: AuthConfig, cache: Cache) =>
        createBetterAuth({
          database: pool,
          secret: config.secret,
          baseUrl: config.baseUrl,
          trustedOrigins: config.trustedOrigins,
          sessionExpiresIn: config.sessionExpiresIn,
          sessionUpdateAge: config.sessionUpdateAge,
          secondaryStorage: {
            get: async (key: string) =>
              (await cache.get<string>(key)) ?? null,
            set: async (key: string, value: string) => {
              await cache.set(key, value);
            },
            delete: async (key: string) => {
              await cache.del(key);
            },
          },
        }),
    },
    AuthService,
    AuthGuard,
    AuthHealthCheckIndicator,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService, AuthHealthCheckIndicator],
})
export class AuthModule implements OnModuleDestroy {
  constructor(private readonly pool: Pool) {}
  async onModuleDestroy() {
    await this.pool.end();
  }
}
