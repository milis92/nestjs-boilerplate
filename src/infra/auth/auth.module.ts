import {
  Global,
  MiddlewareConsumer,
  Module,
  NestModule,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, DiscoveryModule } from '@nestjs/core';
import { Cache } from '@nestjs/cache-manager';
import { Pool } from 'pg';
import helmet from 'helmet';

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
import { UserCreatedHookRegistry } from '@/infra/auth/hooks/user-created.hook';

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
  imports: [ConfigModule.forFeature(authConfig), DiscoveryModule],
  providers: [
    {
      provide: Pool,
      inject: [authConfig.KEY],
      useFactory: (config: AuthConfig) => createAuthPool(config),
    },
    UserCreatedHookRegistry,
    {
      provide: BETTER_AUTH,
      inject: [Pool, authConfig.KEY, Cache, UserCreatedHookRegistry],
      useFactory: (
        pool: Pool,
        config: AuthConfig,
        cache: Cache,
        registry: UserCreatedHookRegistry,
      ) =>
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
          onUserCreated: (userId) => registry.run(userId),
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
export class AuthModule implements NestModule, OnModuleDestroy {
  constructor(private readonly pool: Pool) {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        helmet({
          contentSecurityPolicy: {
            directives: {
              defaultSrc: [`'self'`],
              styleSrc: [`'self'`, `'unsafe-inline'`],
              fontSrc: [`'self'`, 'data:'],
              imgSrc: [`'self'`, 'data:'],
              scriptSrc: [`'self'`, `'unsafe-inline'`],
              connectSrc: [`'self'`],
            },
          },
        }),
      )
      .forRoutes('auth/open-api');
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
