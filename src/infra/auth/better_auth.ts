import { betterAuth, SecondaryStorage } from 'better-auth';
import { Pool } from 'pg';
import { databaseConfig } from '@/config/database.config';
import { authConfig } from '@/config/auth.config';
import { openAPI } from 'better-auth/plugins';

const pgPool = () => {
  const config = databaseConfig();
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
};

/**
 * Creates and configures a BetterAuth instance with the application settings.
 *
 * @param secondaryStorage - Optional secondary storage for session data (e.g., Redis)
 * @returns A configured BetterAuth instance
 */
export default function betterAuthConfig(
  secondaryStorage?: SecondaryStorage,
) {
  const config = authConfig();
  return betterAuth({
    appName: 'api',
    secret: config.secret,
    baseURL: config.baseUrl,
    trustedOrigins: config.trustedOrigins,
    database: pgPool(),
    emailAndPassword: {
      enabled: true,
    },
    user: {
      additionalFields: {
        name: {
          type: 'string',
          // Make the name optional
          required: false,
        },
      },
    },
    plugins: [
      openAPI({
        // Disable default documentation endpoint
        disableDefaultReference: true,
      }),
    ],
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // refresh daily
      disableSessionRefresh: false,
    },
    secondaryStorage: secondaryStorage,
    experimental: { joins: true },
  });
}
