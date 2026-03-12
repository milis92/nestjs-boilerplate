import {
  AUTH_SCHEMA_NAME,
  createBetterAuth,
} from '@/infra/auth/auth.factory';
import { Pool } from 'pg';

const ssl = process.env.AUTH_DATABASE_SSL === 'true';

export const auth = createBetterAuth({
  baseUrl: process.env.AUTH_BASE_URL!,
  secret: process.env.AUTH_SECRET!,
  trustedOrigins: process.env.AUTH_TRUSTED_ORIGINS!.split(','),
  database: new Pool({
    host: process.env.AUTH_DATABASE_HOST ?? 'localhost',
    port: Number(process.env.AUTH_DATABASE_PORT ?? 5432),
    database: process.env.AUTH_DATABASE_DB,
    user: process.env.AUTH_DATABASE_USER,
    password: process.env.AUTH_DATABASE_PASSWORD,
    ssl: ssl
      ? {
          rejectUnauthorized:
            process.env.AUTH_DATABASE_SSL_REJECT_UNAUTHORIZED ===
            'true',
        }
      : false,
    options: `-c search_path=${AUTH_SCHEMA_NAME}'`,
  }),
});
