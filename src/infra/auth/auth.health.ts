import { Injectable } from '@nestjs/common';
import { AuthService } from '@/infra/auth/auth.service';

@Injectable()
export class AuthHealthCheckIndicator {
  constructor(private readonly authService: AuthService) {}

  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.authService.api.ok();
      return result.ok === true;
    } catch {
      return false;
    }
  }
}
