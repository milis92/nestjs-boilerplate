import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class DatabaseHealthCheckIndicator {
  constructor(private readonly db: NodePgDatabase) {}

  async isHealthy(): Promise<boolean> {
    return await this.db
      .execute(sql`SELECT 1`)
      .then(() => true)
      .catch(() => false);
  }
}
