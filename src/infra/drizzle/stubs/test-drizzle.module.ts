import {
  DynamicModule,
  Global,
  Module,
  OnModuleDestroy,
} from '@nestjs/common';
import { Cache } from '@nestjs/cache-manager';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
  DRIZZLE_DB,
  type DrizzleDatabase,
} from '@/infra/drizzle/drizzle.module';
import { DrizzleCacheStore } from '@/infra/drizzle/drizzle-cache.store';
import * as schema from '@/infra/drizzle/schema';
import { relations } from '@/infra/drizzle/relations';

export interface PostgresConnectionConfig {
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_DB: string;
}

@Global()
@Module({})
export class TestDrizzleModule implements OnModuleDestroy {
  constructor(private readonly pool: Pool) {}

  static forRoot(config: PostgresConnectionConfig): DynamicModule {
    return {
      module: TestDrizzleModule,
      providers: [
        {
          provide: Pool,
          useFactory: () =>
            new Pool({
              host: config.POSTGRES_HOST,
              port: config.POSTGRES_PORT,
              database: config.POSTGRES_DB,
              user: config.POSTGRES_USER,
              password: config.POSTGRES_PASSWORD,
              ssl: false,
            }),
        },
        {
          provide: DRIZZLE_DB,
          inject: [Pool, Cache],
          useFactory: (pool: Pool, cacheManager: Cache): DrizzleDatabase =>
            drizzle({
              client: pool,
              schema,
              relations,
              cache: new DrizzleCacheStore(cacheManager, 300_000),
            }),
        },
      ],
      exports: [Pool, DRIZZLE_DB],
    };
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
