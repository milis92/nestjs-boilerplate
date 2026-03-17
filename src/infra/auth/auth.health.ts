import { Injectable } from '@nestjs/common';

import { AuthService } from '@/infra/auth/auth.service';
import {
  type HealthIndicator,
  RegisterHealthIndicator,
} from '@/tools/health/health.indicator';

/** Health check indicator that verifies BetterAuth is operational. */
@Injectable()
@RegisterHealthIndicator('auth')
export class AuthHealthCheckIndicator implements HealthIndicator {
  constructor(private readonly authService: AuthService) {}

  /** Returns true if the BetterAuth API responds successfully to an OK check. */
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.authService.api.ok();
      return result.ok === true;
    } catch {
      return false;
    }
  }
}
