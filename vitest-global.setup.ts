import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool, PoolConfig } from 'pg';
import type { TestProject } from 'vitest/node';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { getMigrations } from 'better-auth/db/migration';

import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import {
  RedisContainer,
  StartedRedisContainer,
} from '@testcontainers/redis';

import {
  AUTH_SCHEMA_NAME,
  createBetterAuth,
} from '@/infra/auth/auth.factory';

const DATABASE_DIR = '.database';
const PUBLIC_MIGRATIONS_DIR = join(DATABASE_DIR, 'public');
const INIT_SQL_PATH = join(DATABASE_DIR, 'init-db.sql');

let container: StartedPostgreSqlContainer;
let redisContainer: StartedRedisContainer;

/**
 * Creates the `auth` schema, then uses BetterAuth's runtime
 * `compileMigrations()` to generate and apply auth DDL — no
 * committed migration files required.
 */
async function migrateAuth(poolConfig: PoolConfig): Promise<void> {
  const pool = new Pool(poolConfig);
  try {
    const initSql = readFileSync(INIT_SQL_PATH, 'utf-8');
    await pool.query(initSql);
  } finally {
    await pool.end();
  }

  const authPool = new Pool({
    ...poolConfig,
    options: `-c search_path=${AUTH_SCHEMA_NAME}`,
  });
  try {
    const auth = createBetterAuth({
      database: authPool,
      secret: process.env.AUTH_SECRET ?? 'test-secret',
      baseUrl: process.env.AUTH_BASE_URL ?? 'http://localhost:3000',
      trustedOrigins: process.env.AUTH_TRUSTED_ORIGINS?.split(',') ?? [
        'http://localhost:3000',
      ],
    });
    const { compileMigrations } = await getMigrations(auth.options);
    const sql = await compileMigrations();
    if (sql) {
      await authPool.query(sql);
    }
  } finally {
    await authPool.end();
  }
}

/**
 * Applies public-schema migrations from committed Drizzle
 * migration files in `.database/public/`.
 */
async function migratePublic(poolConfig: PoolConfig): Promise<void> {
  const pool = new Pool(poolConfig);
  try {
    const db = drizzle({ client: pool });
    await migrate(db, { migrationsFolder: PUBLIC_MIGRATIONS_DIR });
  } finally {
    await pool.end();
  }
}

/**
 * Vitest global setup that provisions a PostgreSQL testcontainer
 * shared across all test files in a single vitest run.
 *
 * Starts an empty PostgreSQL container, then applies migrations:
 * - Auth schema via BetterAuth's compileMigrations() (runtime)
 * - Public schema via Drizzle's migrate() (committed migration files)
 */
export async function setup(project: TestProject) {
  // Guard against duplicate invocations (vitest may call setup per project)
  if (container !== undefined) {
    return;
  }

  container = await new PostgreSqlContainer('postgres:latest')
    .withDatabase(process.env.POSTGRES_DB ?? 'test_db')
    .withUsername(process.env.POSTGRES_USER ?? 'test')
    .withPassword(process.env.POSTGRES_PASSWORD ?? 'test')
    .start();

  const poolConfig: PoolConfig = {
    host: container.getHost(),
    port: container.getMappedPort(5432),
    database: container.getDatabase(),
    user: container.getUsername(),
    password: container.getPassword(),
    ssl: false,
  };

  await migrateAuth(poolConfig);
  await migratePublic(poolConfig);

  project.provide('POSTGRES_CONNECTION_CONFIG', {
    POSTGRES_USER: container.getUsername(),
    POSTGRES_PASSWORD: container.getPassword(),
    POSTGRES_HOST: container.getHost(),
    POSTGRES_PORT: container.getMappedPort(5432),
    POSTGRES_DB: container.getDatabase(),
  });

  redisContainer = await new RedisContainer('redis:latest').start();

  project.provide('REDIS_CONNECTION_CONFIG', {
    host: redisContainer.getHost(),
    port: redisContainer.getMappedPort(6379),
  });
}

export async function teardown() {
  await redisContainer?.stop();
  await container?.stop();
}

declare module 'vitest' {
  export interface ProvidedContext {
    POSTGRES_CONNECTION_CONFIG: {
      POSTGRES_USER: string;
      POSTGRES_PASSWORD: string;
      POSTGRES_HOST: string;
      POSTGRES_PORT: number;
      POSTGRES_DB: string;
    };
    REDIS_CONNECTION_CONFIG: {
      host: string;
      port: number;
    };
  }
}
