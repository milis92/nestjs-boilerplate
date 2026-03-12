import { Injectable } from '@nestjs/common';
import { AuthService } from '@/infra/auth/auth.service';

/** Health check indicator that verifies BetterAuth is operational. */
@Injectable()
export class AuthHealthCheckIndicator {
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
