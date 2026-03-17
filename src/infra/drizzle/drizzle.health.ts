import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';

import {
  type HealthIndicator,
  RegisterHealthIndicator,
} from '@/tools/health/health.indicator';

/** Health check indicator that verifies PostgreSQL connectivity via a simple query. */
@Injectable()
@RegisterHealthIndicator('database')
export class DrizzleHealthCheckIndicator implements HealthIndicator {
  constructor(private readonly pool: Pool) {}

  /** Returns true if a `SELECT 1` query succeeds against the database pool. */
  async isHealthy(): Promise<boolean> {
    return await this.pool
      .query('SELECT 1')
      .then(() => true)
      .catch(() => false);
  }
}
