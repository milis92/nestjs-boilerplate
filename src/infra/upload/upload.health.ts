import { Inject, Injectable } from '@nestjs/common';
import { statfs } from 'fs/promises';

import uploadConfig, { UploadConfig } from '@/config/upload.config';
import {
  type HealthIndicator,
  RegisterHealthIndicator,
} from '@/tools/health/health.indicator';

/** Health check indicator that verifies disk space at the upload destination. */
@Injectable()
@RegisterHealthIndicator('upload')
export class UploadHealthCheckIndicator implements HealthIndicator {
  constructor(
    @Inject(uploadConfig.KEY) private readonly config: UploadConfig,
  ) {}

  /** Returns true if disk space at the upload destination is sufficient. */
  async isHealthy(): Promise<boolean> {
    try {
      const stats = await statfs(this.config.dest);
      const freeSpace = stats.bsize * stats.bfree;
      const availableSpace = stats.bsize * stats.bavail;
      return freeSpace > availableSpace * this.config.diskThreshold;
    } catch {
      return false;
    }
  }
}
