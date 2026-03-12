import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/infra/drizzle/schema.ts',
  out: './.database',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'postgres',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    ssl:
      process.env.POSTGRES_SSL === 'true'
        ? {
            rejectUnauthorized:
              process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED !==
              'false',
          }
        : false,
  },
  strict: true,
  schemaFilter: ['public'],
  introspect: {
    casing: 'camel',
  },
});
