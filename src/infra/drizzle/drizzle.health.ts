import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';

/** Health check indicator that verifies PostgreSQL connectivity via a simple query. */
@Injectable()
export class DrizzleHealthCheckIndicator {
  constructor(private readonly pool: Pool) {}

  /** Returns true if a `SELECT 1` query succeeds against the database pool. */
  async isHealthy(): Promise<boolean> {
    return await this.pool
      .query('SELECT 1')
      .then(() => true)
      .catch(() => false);
  }
}
