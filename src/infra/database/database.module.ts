import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import databaseConfig, {
  DatabaseConfig,
} from '@/config/database.config';
import { DatabaseHealthCheckIndicator } from './database.health';

function DrizzleClient(config: DatabaseConfig): NodePgDatabase {
  const pool = new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl
      ? { rejectUnauthorized: config.rejectUnauthorized }
      : false,
  });
  return drizzle(pool);
}

/**
 * Module that provides database connectivity using Drizzle ORM with PostgreSQL.
 *
 * ### Purpose
 *
 * This module configures and exposes a Drizzle ORM client connected to PostgreSQL,
 * enabling type-safe database queries throughout the application. It also provides
 * a health check indicator for monitoring database connectivity.
 *
 * ### Connection Configuration
 *
 * The database connection is configured via environment variables and supports:
 * - Standard PostgreSQL connection parameters (host, port, database, user, password)
 * - SSL/TLS connections with configurable certificate validation
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(private readonly db: NodePgDatabase) {}
 *
 *   async findAll() {
 *     return this.db.select().from(users);
 *   }
 * }
 * ```
 */
@Global()
@Module({
  imports: [ConfigModule.forFeature(databaseConfig)],
  providers: [
    {
      provide: NodePgDatabase,
      inject: [databaseConfig.KEY],
      useFactory: (config: DatabaseConfig) => DrizzleClient(config),
    },
    DatabaseHealthCheckIndicator,
  ],
  exports: [NodePgDatabase, DatabaseHealthCheckIndicator],
})
export class DatabaseModule {}
