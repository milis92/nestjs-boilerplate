import fs from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { TestProject } from 'vitest/node';

import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

let container: StartedPostgreSqlContainer;

/**
 * Vitest global setup that provisions a PostgreSQL testcontainer
 * shared across all test files in a single vitest run.
 *
 * All SQL files from `.database/` are copied into the container's
 * `/docker-entrypoint-initdb.d/` directory so PostgreSQL executes them
 * automatically on startup (alphabetical order):
 *   1. `00_init-db.sql`  — base schema / extensions
 *   2. `{timestamp}_{name}.sql` — Drizzle migrations, sorted by timestamp
 *
 * The resulting connection string is provided to test files via
 * `project.provide('connectionString', ...)`.
 */
export async function setup(project: TestProject) {
  // Guard against duplicate invocations (vitest may call setup per project)
  if (container !== undefined) {
    return;
  }

  // Collect all .sql files to copy into the container's init directory.
  // init-db.sql is prefixed with 00_ to guarantee it runs first.
  const migrationsDir = join(__dirname, '.database');
  const sqlFiles: { source: string; target: string }[] = [
    {
      source: join(migrationsDir, 'init-db.sql'),
      target: '/docker-entrypoint-initdb.d/00_init-db.sql',
    },
  ];

  // Discover migration folders (e.g. 20260305154054_high_oracle/)
  // and map each migration.sql to a flat file named after the folder.
  // BetterAuth migrations (_better-auth suffix) are prefixed with 01_
  // so they run right after init-db.sql and before Drizzle migrations,
  // since Drizzle FKs reference auth.user which BetterAuth creates.
  const folders = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const tempFiles: string[] = [];
  for (const folder of folders) {
    const sqlPath = join(migrationsDir, folder, 'migration.sql');
    if (fs.existsSync(sqlPath)) {
      const isBetterAuth = folder.endsWith('_better-auth');
      const targetName = isBetterAuth ? `01_${folder}.sql` : `${folder}.sql`;

      let source = sqlPath;
      if (isBetterAuth) {
        // BetterAuth generates SQL without schema qualifiers.
        // Prepend SET search_path so tables are created in the auth schema.
        const tempPath = join(tmpdir(), `${folder}.sql`);
        const sql = fs.readFileSync(sqlPath, 'utf-8');
        fs.writeFileSync(tempPath, `SET search_path TO auth;\n\n${sql}`);
        source = tempPath;
        tempFiles.push(tempPath);
      }

      sqlFiles.push({
        source,
        target: `/docker-entrypoint-initdb.d/${targetName}`,
      });
    }
  }

  container = await new PostgreSqlContainer('postgres:latest')
    .withDatabase(process.env.POSTGRES_DB ?? 'test_db')
    .withUsername(process.env.POSTGRES_USER ?? 'test')
    .withPassword(process.env.POSTGRES_PASSWORD ?? 'test')
    .withCopyFilesToContainer(sqlFiles)
    .start();

  for (const tempFile of tempFiles) {
    fs.unlinkSync(tempFile);
  }

  project.provide('POSTGRES_CONNECTION_CONFIG', {
    POSTGRES_USER: container.getUsername(),
    POSTGRES_PASSWORD: container.getPassword(),
    POSTGRES_HOST: container.getHost(),
    POSTGRES_PORT: container.getMappedPort(5432),
    POSTGRES_DB: container.getDatabase()
  });
}

export async function teardown() {
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
  }
}
