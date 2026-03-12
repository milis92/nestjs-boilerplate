import { Cache as NestCache } from '@nestjs/cache-manager';
import { Cache } from 'drizzle-orm/cache/core/cache';
import type { CacheConfig } from 'drizzle-orm/cache/core/types';
import { Table, is, getTableName } from 'drizzle-orm';

/**
 * Drizzle query-level cache backed by NestJS CACHE_MANAGER (L1 memory + L2 Redis).
 *
 * Caches all queries by default. On INSERT/UPDATE/DELETE, automatically
 * invalidates cached queries that involve the mutated tables.
 */
export class DrizzleCacheStore extends Cache {
  /** Maps table name → set of cache keys that queried that table. */
  private tableKeys = new Map<string, Set<string>>();

  constructor(
    private readonly cacheManager: NestCache,
    private readonly defaultTtlMs: number = 60 * 15000, // 15 minutes
  ) {
    super();
  }

  /** Cache all queries by default (not just tagged ones). */
  override strategy(): 'all' {
    return 'all';
  }

  /** Retrieves a cached query result by key, or undefined on miss. */
  override async get(key: string): Promise<any[] | undefined> {
    return (await this.cacheManager.get<any[]>(key)) ?? undefined;
  }

  /** Stores a query result and tracks which tables it depends on for invalidation. */
  override async put(
    key: string,
    response: any,
    tables: string[],
    _isTag: boolean,
    config?: CacheConfig,
  ): Promise<void> {
    const ttl =
      config?.px ?? (config?.ex ? config.ex * 1000 : this.defaultTtlMs);
    await this.cacheManager.set(key, response, ttl);

    for (const table of tables) {
      let keys = this.tableKeys.get(table);
      if (!keys) {
        keys = new Set();
        this.tableKeys.set(table, keys);
      }
      keys.add(key);
    }
  }

  /**
   * Invalidates cached queries when a table is mutated.
   * Deletes all cache keys that were associated with the mutated tables.
   */
  override async onMutate(params: {
    tags?: string | string[];
    tables?: string | string[] | Table<any> | Table<any>[];
  }): Promise<void> {
    const tables = params.tables
      ? Array.isArray(params.tables)
        ? params.tables
        : [params.tables]
      : [];
    const tags = params.tags
      ? Array.isArray(params.tags)
        ? params.tags
        : [params.tags]
      : [];

    for (const tag of tags) {
      await this.cacheManager.del(tag);
    }

    for (const table of tables) {
      const tableName = is(table, Table)
        ? getTableName(table)
        : (table as string);

      const keys = this.tableKeys.get(tableName);
      if (keys) {
        for (const key of keys) {
          await this.cacheManager.del(key);
        }
        this.tableKeys.delete(tableName);
      }
    }
  }
}
