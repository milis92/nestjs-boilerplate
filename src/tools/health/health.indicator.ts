import { SetMetadata } from '@nestjs/common';

/** Contract for auto-discovered health check indicators. */
export interface HealthIndicator {
  isHealthy(): Promise<boolean>;
}

export const HEALTH_INDICATOR_KEY = 'HEALTH_INDICATOR';

/** Marks a class for health check auto-discovery with the given name. */
export const RegisterHealthIndicator = (
  name: string,
): ClassDecorator => SetMetadata(HEALTH_INDICATOR_KEY, name);
