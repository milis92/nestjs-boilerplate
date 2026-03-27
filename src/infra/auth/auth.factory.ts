import { admin, openAPI } from 'better-auth/plugins';
import {
  betterAuth,
  BetterAuthOptions,
  BetterAuthPlugin,
  DBAdapterInstance,
  SecondaryStorage,
} from 'better-auth';
import { Pool } from 'pg';
import { apiKey } from '@better-auth/api-key';

/** Return type of {@link createBetterAuth} — the configured BetterAuth instance. */
export type BetterAuthInstance = ReturnType<typeof createBetterAuth>;
export const BETTER_AUTH = Symbol('BETTER_AUTH');

export const AUTH_SCHEMA_NAME = 'auth';

/** Configuration parameters for creating a BetterAuth instance. */
export interface BetterAuthFactoryParams {
  database: Pool | DBAdapterInstance;
  secret: string;
  baseUrl: string;
  trustedOrigins: string[];
  sessionExpiresIn?: number;
  sessionUpdateAge?: number;
  secondaryStorage?: SecondaryStorage;
  plugins?: BetterAuthPlugin[];
}

/** Creates and configures a BetterAuth instance with email/password auth and OpenAPI plugin. */
export function createBetterAuth(params: BetterAuthFactoryParams) {
  return betterAuth({
    appName: 'api',
    database: params.database,
    emailAndPassword: {
      enabled: true,
    },
    user: {
      additionalFields: {
        name: {
          type: 'string',
          required: false,
        },
      },
    },
    plugins: [
      admin(),
      apiKey(),
      ...(params.plugins ?? []),
      openAPI({
        disableDefaultReference: true,
      }),
    ],
    secret: params.secret,
    baseURL: params.baseUrl,
    trustedOrigins: params.trustedOrigins,
    session: {
      expiresIn: params.sessionExpiresIn,
      updateAge: params.sessionUpdateAge,
    },
    secondaryStorage: params.secondaryStorage,
    advanced: {
      // Use standard UUIDs for all BetterAuth-managed entities (users, sessions)
      database: { generateId: 'uuid' },
    },
    // Enable experimental join queries for eager-loading user relations in a single query
    experimental: { joins: true },
  } satisfies BetterAuthOptions);
}
