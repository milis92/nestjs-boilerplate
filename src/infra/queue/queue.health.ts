import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import {
  type HealthIndicator,
  RegisterHealthIndicator,
} from '@/tools/health/health.indicator';

/**
 * Health check indicator for the BullMQ job queue system.
 *
 * Used by the application's health check endpoint to verify that
 * the Redis-backed queue infrastructure is operational and can
 * accept jobs across application instances.
 */
@Injectable()
@RegisterHealthIndicator('queue')
export class QueueHealthCheckIndicator implements HealthIndicator {
  constructor(@InjectQueue('health') private readonly queue: Queue) {}

  /** Returns true if the queue's Redis connection responds to a ping. */
  async isHealthy(): Promise<boolean> {
    return await this.queue.client
      .then((client) => client.ping())
      .then(() => true)
      .catch(() => false);
  }
}
